# ティラノスクリプト向け Buttplug 連携プラグイン

## 使い方

```
; [buttplug_start: デバイスにコマンドを送信する]

; 回転デバイスの場合
[buttplug_start devices="Vorze UFO SA" speed="20" direction="1"]
; ピストンデバイスの場合
[buttplug_start devices="Vorze Piston" position="30" duration="10"]
[buttplug_start devices="Vorze Piston" position="30" speed="5"]
; 振動デバイスの場合
[buttplug_start devices="Vorze Bach" value="50"]

; 複数デバイスを指定する
[buttplug_start devices="Vorze UFO SA,Vorze UFO TW" speed="20" direction="1"]

; デバイスが複数のfeatureを持つ場合、「#」を用いて特定のfeatureを指定することができます
; 「#」の後に数字を記述すると、その数字に対応するfeatureが選択されます
[buttplug_start devices="Vorze UFO TW#0" speed="20" direction="1"]
; 「#」の後に動作の名称を記述すると、その名称に対応するfeatureが選択されます
[buttplug_start devices="Vorze UFO TW#rotate" speed="20" direction="1"]
; 上の2つを組み合わせると、特定の種類の特定のfeatureを指定できます
[buttplug_start devices="Vorze UFO TW#rotate0" speed="20" direction="1"]


; [buttplug_start_csv: デバイスにCSVパターンを送信する]

[buttplug_start_csv devices="Vorze UFO TW" storage="scene1_ufotw.csv"]


; [buttplug_stop: デバイスの動作を停止する]

[buttplug_stop groups="ペニス(回転)" devices=""]


; [buttplug_stop_all: すべてのデバイスの動作を停止する]

[buttplug_stop_all]


; [buttplug_group: デバイスのグループを作成する]

[buttplug_group name="乳首(回転・左右別)" devices="Vorze UFO TW"]
[buttplug_group name="乳首(回転)" devices="Vorze UFO SA"]
[buttplug_group name="乳首(振動・左右別)" devices=""]
[buttplug_group name="乳首(振動)" devices=""]
[buttplug_group name="ペニス(回転)" devices="Vorze A10 Cyclone SA,Syncbot#rotate,ungrouped_rotate"]
[buttplug_group name="ペニス(ピストン)" devices="Vorze Piston,Syncbot#position,ungrouped_position"]
[buttplug_group name="ペニス(振動)" devices="Vorze Bach,ungrouped_vibrate"]


; [buttplug_info: 現在のButtplugの接続状態を表示する]

[buttplug_info x="0" y="0" width="100" height="100"]
```

## タグリファレンス

### `[buttplug_start]`

- `devices`: デバイス名
  - デフォルト値: `""`
  - コマンドを送信するデバイスの名前をカンマ区切りで記述します。詳しくは「デバイスの指定方法」を参照してくださいださい。
- `groups`: グループ名
  - デフォルト値: `""`
  - コマンドを送信するグループの名前をカンマ区切りで記述します。グループは `[buttplug_group]` タグで事前に定義されている必要があります。定義されていないグループ名を使用した場合、エラーになります。
- `speed`: 速度
  - デフォルト値: `0`
  - デバイスの速度を指定します。100 が最大値で、0 が最小値です。デバイスが RotateCmd に対応している場合、回転の速度を指定します。デバイスが LinearCmd に対応している場合、現在のデバイスの位置をもとに `duration` の値を計算し、その速度で動作します。デバイスがいずれのコマンドにも対応していない場合、無視されます。
- `direction`: 方向
  - デフォルト値: `0`
  - デバイスの回転方向を指定します。0 が時計回り、1 が反時計回りです。デバイスが RotateCmd に対応している場合のみ有効です。
- `position`: 位置
  - デフォルト値: `0`
  - デバイスの位置を指定します。0 が最小値で、100 が最大値です。デバイスが LinearCmd に対応している場合のみ有効です。
- `duration`: 時間
  - デフォルト値: `0`
  - デバイスの動作時間をミリ秒単位で指定します。デバイスが LinearCmd に対応している場合のみ有効です。
- `value`: 値
  - デフォルト値: `0`
  - デバイスの動作値を指定します。デバイスが ScalarCmd に対応している場合のみ有効です。

## デバイスの指定方法

### 特殊なデバイス名

- `ungrouped_xxx`: `xxx` の動作を行うデバイスのうち、いずれのグループにも属していないデバイスを指定します。以下の値が有効です。
  - `ungrouped_vibrate` `ungrouped_rotate` `ungrouped_oscillate` `ungrouped_constrict` `ungrouped_inflate` `ungrouped_position` `ungrouped_battery` `ungrouped_rssi` `ungrouped_pressure`
- `ungrouped`: いずれのグループにも属しておらず、また `ungrouped_xxx` の形で指定されてもいないデバイスを指定します。
- `all_xxx`: `xxx` の動作を行うデバイスをすべて指定します。以下の値が有効です。
  - `all_vibrate` `all_rotate` `all_oscillate` `all_constrict` `all_inflate` `all_position` `all_battery` `all_rssi` `all_pressure`
- `all`: すべてのデバイスを指定します。

## 免責事項

このプラグインは Buttplug の Websocket サーバと通信するためのプラグインです。Buttplug およびこのプラグインの開発者このプラグインについて一切の責任を負いません。このプラグインを使用する際は、自己責任でお願いします。

## ライセンス

このプラグインは MIT ライセンスの元で公開されています。詳細は LICENSE ファイルを参照してください。
