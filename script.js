// グローバル変数
let masterData = [];       // 読み込んだ全データ
let questionPool = [];     // 出題用プール
let quizHistory = [];      // 回答履歴
let currentQuestion = null;

// 初期化処理：最初はデフォルト（選択されているもの）を読み込む
window.onload = function() {
    changeDataset();
};

// データセットの切り替え・読み込み処理
async function changeDataset() {
    const selectBox = document.getElementById('dataset-select');
    const fileName = selectBox.value;

    // ユーザーへの確認（履歴がある場合のみ）
    if (quizHistory.length > 0) {
        const confirmChange = confirm("出題範囲を変更すると、現在の成績はクリアされます。よろしいですか？");
        if (!confirmChange) {
            // キャンセルした場合、選択を元に戻す（簡易的な処理）
            // ※厳密に戻すには直前の値を保持する必要がありますが、今回はそのままリロードせず終了
            return; 
        }
    }

    try {
        // UIをロード中表示にするなどしても良いですが、今回はシンプルにアラート等をクリア
        document.getElementById('question-text').textContent = "データを読み込んでいます...";

        const response = await fetch(fileName);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const rawData = await response.json();

        // データのクリーニング
        masterData = rawData.filter(item => item.rgb && item.rgb.trim().startsWith("#"));

        if (masterData.length === 0) {
            alert(`選択されたファイル(${fileName})に有効なデータが見つかりませんでした。`);
            return;
        }

        // 新しいデータでゲームを開始
        startNewGame();

    } catch (error) {
        console.error("データの読み込みに失敗しました:", error);
        alert(`データの読み込みに失敗しました。\nファイル名: ${fileName}\nエラー内容: ${error.message}`);
    }
}

// ゲームの初期化・リセット
function startNewGame() {
    // 配列のコピーを作成
    questionPool = [...masterData];
    quizHistory = [];
    
    // 履歴画面のクリア
    const tbody = document.getElementById('summary-body');
    tbody.innerHTML = "";
    document.getElementById('summary-score').textContent = "正解数: 0 / 0";

    // UIリセット
    document.getElementById('summary-area').classList.add('hidden');
    document.getElementById('result-area').classList.add('hidden');
    document.getElementById('quiz-area').classList.remove('hidden');
    document.getElementById('show-summary-btn').style.display = 'inline-block';
    document.getElementById('return-btn').style.display = 'inline-block';

    loadQuestion();
}

// 問題をロードして表示する
function loadQuestion() {
    if (questionPool.length === 0) {
        showSummary(true); // 全問終了
        return;
    }

    // UIのリセット
    document.getElementById('quiz-area').classList.remove('hidden');
    document.getElementById('result-area').classList.add('hidden');
    document.getElementById('summary-area').classList.add('hidden');
    document.getElementById('input-name').value = "";
    document.getElementById('input-system').value = "";

    // ランダムに1問選ぶ
    const randomIndex = Math.floor(Math.random() * questionPool.length);
    currentQuestion = questionPool[randomIndex];
    
    // プールから削除
    questionPool.splice(randomIndex, 1);

    // 残り問題数の表示更新
    document.getElementById('progress-label').textContent = `残り: ${questionPool.length + 1} 問`;

    // 問題文の表示
    document.getElementById('question-text').textContent = currentQuestion.description;
}

// 回答チェック
function checkAnswer() {
    const inputName = document.getElementById('input-name').value.trim();
    const inputSystem = document.getElementById('input-system').value.trim();

    if (!inputName || !inputSystem) {
        alert("「色名」と「系統色名」の両方を入力してください。");
        return;
    }

    document.getElementById('quiz-area').classList.add('hidden');
    document.getElementById('result-area').classList.remove('hidden');

    const isNameCorrect = currentQuestion.name.includes(inputName);
    const isSystemCorrect = inputSystem === currentQuestion.systemcolorname;
    const isAllCorrect = isNameCorrect && isSystemCorrect;

    quizHistory.push({
        question: currentQuestion,
        userAnswerName: inputName,
        userAnswerSystem: inputSystem,
        isNameCorrect: isNameCorrect,
        isSystemCorrect: isSystemCorrect,
        isAllCorrect: isAllCorrect
    });

    const resultTitle = document.getElementById('result-title');
    if (isAllCorrect) {
        resultTitle.textContent = "正解！";
        resultTitle.className = "correct";
    } else if (isNameCorrect) {
        resultTitle.textContent = "惜しい！系統色名が違います";
        resultTitle.className = "incorrect";
    } else if (isSystemCorrect) {
        resultTitle.textContent = "惜しい！色名が違います";
        resultTitle.className = "incorrect";
    } else {
        resultTitle.textContent = "不正解...";
        resultTitle.className = "incorrect";
    }

    document.getElementById('res-name').innerHTML = `${currentQuestion.name} <span class="${isNameCorrect ? 'correct-mark' : 'incorrect-mark'}">${isNameCorrect ? '◯' : '✕'}</span>`;
    document.getElementById('res-system').innerHTML = `${currentQuestion.systemcolorname} <span class="${isSystemCorrect ? 'correct-mark' : 'incorrect-mark'}">${isSystemCorrect ? '◯' : '✕'}</span>`;
    document.getElementById('res-munsell').textContent = currentQuestion.munsell;
    document.getElementById('res-rgb').textContent = currentQuestion.rgb;
    document.getElementById('res-desc').textContent = currentQuestion.description;

    const preview = document.getElementById('color-preview');
    preview.style.backgroundColor = currentQuestion.rgb;

    const nextBtn = document.getElementById('next-btn');
    if (questionPool.length === 0) {
        nextBtn.textContent = "結果を見る（全問終了）";
    } else {
        nextBtn.textContent = "次の問題へ";
    }
}

// 次の問題へ
function nextQuestion() {
    loadQuestion();
}

// 総合結果を表示
function showSummary(isFinished = false) {
    document.getElementById('quiz-area').classList.add('hidden');
    document.getElementById('result-area').classList.add('hidden');
    document.getElementById('summary-area').classList.remove('hidden');

    if (isFinished || questionPool.length === 0) {
        document.getElementById('return-btn').style.display = 'none';
        if(isFinished) alert("すべての問題が終了しました！");
    } else {
        document.getElementById('return-btn').style.display = 'inline-block';
    }

    const correctCount = quizHistory.filter(h => h.isAllCorrect).length;
    const totalCount = quizHistory.length;
    document.getElementById('summary-score').textContent = `現在の正解数: ${correctCount} / ${totalCount}`;

    const tbody = document.getElementById('summary-body');
    tbody.innerHTML = "";

    quizHistory.forEach((history, index) => {
        const tr = document.createElement('tr');
        
        let statusHtml = "";
        if (history.isAllCorrect) statusHtml = '<span class="status-ok">◎</span>';
        else if (history.isNameCorrect) statusHtml = '<span class="incorrect">色名◯</span>';
        else if (history.isSystemCorrect) statusHtml = '<span class="incorrect">系統◯</span>';
        else statusHtml = '<span class="status-ng">✕</span>';

        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>
                <strong>${history.question.name}</strong><br>
                <span style="font-size:0.85em; color:#666;">${history.question.systemcolorname}</span>
            </td>
            <td>
                色: ${history.userAnswerName} ${history.isNameCorrect ? '◯' : '✕'}<br>
                系: ${history.userAnswerSystem} ${history.isSystemCorrect ? '◯' : '✕'}
            </td>
            <td style="text-align:center;">${statusHtml}</td>
        `;
        tbody.appendChild(tr);
    });
}

// 総合結果画面からクイズに戻る
function returnToQuiz() {
    if (currentQuestion && quizHistory.length < masterData.length) {
        const lastHistory = quizHistory[quizHistory.length - 1];
        if (lastHistory && lastHistory.question === currentQuestion) {
             document.getElementById('result-area').classList.remove('hidden');
        } else {
             document.getElementById('quiz-area').classList.remove('hidden');
        }
        document.getElementById('summary-area').classList.add('hidden');
    }
}

// 最初からやり直す（現在のデータセットで）
function restartQuiz() {
    if(confirm("現在の記録は消去され、最初からやり直します。よろしいですか？")) {
        startNewGame();
    }
}