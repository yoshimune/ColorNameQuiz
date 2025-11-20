// グローバル変数
let masterData = [];       // 読み込んだ全データ（変更しない）
let questionPool = [];     // 出題用プール（出題するたびに減る）
let quizHistory = [];      // 回答履歴
let currentQuestion = null;

// 初期化処理
window.onload = async function() {
    try {
        const response = await fetch('colordata.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const rawData = await response.json();

        // データのクリーニング
        masterData = rawData.filter(item => item.rgb && item.rgb.trim().startsWith("#"));

        if (masterData.length === 0) {
            alert("有効なデータが見つかりませんでした。");
            return;
        }

        // クイズを開始
        startNewGame();

    } catch (error) {
        console.error("データの読み込みに失敗しました:", error);
        alert("データの読み込みに失敗しました。\nローカルで実行する場合、VS CodeのLive Server等を使用してください。");
    }
};

// ゲームの初期化・リセット
function startNewGame() {
    // 配列のコピーを作成（参照渡しを防ぐ）
    questionPool = [...masterData];
    quizHistory = [];
    
    // 履歴のクリア
    const tbody = document.getElementById('summary-body');
    tbody.innerHTML = "";
    document.getElementById('summary-score').textContent = "正解数: 0 / 0";

    // UIリセット
    document.getElementById('summary-area').classList.add('hidden');
    document.getElementById('result-area').classList.add('hidden');
    document.getElementById('quiz-area').classList.remove('hidden');
    document.getElementById('show-summary-btn').style.display = 'inline-block';
    document.getElementById('return-btn').style.display = 'inline-block'; // 「クイズに戻る」ボタン

    loadQuestion();
}

// 問題をロードして表示する
function loadQuestion() {
    // 残り問題数チェック
    if (questionPool.length === 0) {
        showSummary(true); // 全問終了モードで結果表示
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
    
    // 選んだ問題をプールから削除（spliceは削除した要素を配列で返すので [0] で取得）
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

    // 必須チェック
    if (!inputName || !inputSystem) {
        alert("「色名」と「系統色名」の両方を入力してください。");
        return;
    }

    // UIの切り替え
    document.getElementById('quiz-area').classList.add('hidden');
    document.getElementById('result-area').classList.remove('hidden');

    // 正誤判定
    const isNameCorrect = currentQuestion.name.includes(inputName);
    const isSystemCorrect = inputSystem === currentQuestion.systemcolorname;
    const isAllCorrect = isNameCorrect && isSystemCorrect;

    // 履歴に保存
    quizHistory.push({
        question: currentQuestion,
        userAnswerName: inputName,
        userAnswerSystem: inputSystem,
        isNameCorrect: isNameCorrect,
        isSystemCorrect: isSystemCorrect,
        isAllCorrect: isAllCorrect
    });

    // 直前の結果表示
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

    // 次へボタンのテキスト制御
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

    // クイズ進行中なら「クイズに戻る」ボタンを表示、終了していたら隠す
    if (isFinished || questionPool.length === 0) {
        document.getElementById('return-btn').style.display = 'none';
        alert("すべての問題が終了しました！お疲れ様でした。");
    } else {
        document.getElementById('return-btn').style.display = 'inline-block';
    }

    // スコア計算
    const correctCount = quizHistory.filter(h => h.isAllCorrect).length;
    const totalCount = quizHistory.length;
    document.getElementById('summary-score').textContent = `現在の正解数: ${correctCount} / ${totalCount}`;

    // テーブル生成
    const tbody = document.getElementById('summary-body');
    tbody.innerHTML = ""; // クリア

    quizHistory.forEach((history, index) => {
        const tr = document.createElement('tr');
        
        // 判定マーク
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
    // まだ未回答の問題がある場合のみ
    if (currentQuestion && quizHistory.length < masterData.length) {
        // 直前に回答したばかり（まだ次の問題をロードしていない状態）か、問題回答中かを判定
        // ここではシンプルに「今の問題が回答済みかどうか」は問わず、
        // クイズ画面 or 結果画面 の適切な方に戻す処理にします。
        
        // もし現在の問題がまだ回答履歴の最後になければ（回答中）、quiz-areaを表示
        // もし現在の問題が回答履歴の最後に一致すれば（結果表示中）、result-areaを表示
        
        const lastHistory = quizHistory[quizHistory.length - 1];
        
        // currentQuestionと履歴の最後が一致＝回答直後の結果画面でサマリーを開いた
        if (lastHistory && lastHistory.question === currentQuestion) {
             document.getElementById('result-area').classList.remove('hidden');
        } else {
             // まだ回答していない
             document.getElementById('quiz-area').classList.remove('hidden');
        }
        
        document.getElementById('summary-area').classList.add('hidden');
    }
}

// 最初からやり直す
function restartQuiz() {
    if(confirm("現在の記録は消去されます。最初からやり直しますか？")) {
        startNewGame();
    }
}