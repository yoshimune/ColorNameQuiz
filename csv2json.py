# Get-ChildItem *.csv | ForEach-Object { python csv2json.py $_.Name }

import csv
import json
import argparse
from pathlib import Path
import sys

def convert_csv_to_json(csv_file_path):
    """
    単一のCSVファイルを読み込み、JSONファイルとして出力する関数
    """
    path_obj = Path(csv_file_path)
    
    # ファイルの存在確認
    if not path_obj.exists():
        print(f"エラー: ファイル '{csv_file_path}' が見つかりません。スキップします。")
        return

    # 出力ファイル名の作成 (拡張子を .json に変更)
    json_file_path = path_obj.with_suffix('.json')

    try:
        # CSVの読み込み (encodingは一般的なutf-8としています。必要に応じて cp932 などに変更可)
        data = []
        with open(path_obj, mode='r', encoding='utf-8', newline='') as f:
            # DictReaderを使うことで1行目をヘッダー(Key)として自動的に扱います
            reader = csv.DictReader(f)
            for row in reader:
                data.append(row)

        # JSONの書き出し
        with open(json_file_path, mode='w', encoding='utf-8') as f:
            # ensure_ascii=False で日本語が文字化けせずにそのまま出力されます
            # indent=4 で人間が読みやすい形式で出力されます
            json.dump(data, f, ensure_ascii=False, indent=4)

        print(f"変換完了: {csv_file_path} -> {json_file_path}")

    except Exception as e:
        print(f"エラー: '{csv_file_path}' の変換中にエラーが発生しました。\n詳細: {e}")

def main():
    # コマンドライン引数の設定
    parser = argparse.ArgumentParser(description='CSVファイルをJSONファイルに変換するツール')
    parser.add_argument('files', nargs='+', help='変換するCSVファイル（複数指定可）')
    
    args = parser.parse_args()

    # 指定された各ファイルに対して変換処理を実行
    for csv_file in args.files:
        convert_csv_to_json(csv_file)

if __name__ == "__main__":
    main()