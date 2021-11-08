# Redirect4replit

このアプリケーションはReplit.comで動作することを目的としたNode.jsのリダイレクト用サーバーです。<br>
このプログラムで何が起きようと責任取りません。

実際の動作: https://r.mfmii.work/gh (API無効化しています)

## 環境変数
---
このプログラムの実行には環境変数(secret-keys)の設定が必須です。

| Key | Value |
| ---- | ---- |
| PASS_ADD | `/system/add-page`のパスワード |
| PASS_DELETE | `/system/delete-page`のパスワード |


## API操作
---
APIの操作はすべてjsonをPOSTして行います。
<br>
`/system/add-page`
```json
{
    "pass": "ADD_PASSWORD",
    "from": "/example",
    "to": "https://example.com",
    "tmp": false
}
```
| Key | Value |
| --- | ----- |
| pass | 環境変数`PASS_ADD` |
| from | リダイレクト元(パスのみ記述) |
| to | リダイレクト先(完全なURL) |
| tmp | trueなら302, falseなら301を返す |

---

`/system/delete-page`
```json
{
    "pass": "DELETE_PASSWORD",
    "from": "/example"
}
```
| Key | Value |
| --- | ----- |
| pass | 環境変数`DELETE_PASS` |
| from | リダイレクト元(パスのみ記述) |

