# Windows 安全签名说明

本项目的桌面安装包使用 Authenticode SHA-256 签名。

## 当前开发签名

构建流程会创建 `CN=Gongtu Development` 自签名代码签名证书，并使用它签署 `release` 目录中的 `.exe` 文件。公钥证书随构建产物一起提供：

`certificates/gongtu-development-code-signing.cer`

自签名证书可以验证文件签名和构建后是否被修改，但 Windows 默认不信任该发布者。若要在受控电脑中显示为受信任发布者，需要由管理员把 `.cer` 安装到“受信任的发布者”和对应的受信任根证书存储区。

不要在不了解风险的电脑上信任开发证书。

## 正式发布

面向公众发布时，应从可信 CA 购买组织验证 OV 或扩展验证 EV 代码签名证书，并替换开发签名。正式签名还应配置 RFC 3161 时间戳服务，以便证书过期后仍能验证签名时间。

## 验证签名

```powershell
Get-AuthenticodeSignature ".\release\Gongtu-Career-Insight-1.0.0-x64-setup.exe" |
  Format-List Status,StatusMessage,SignerCertificate,TimeStamperCertificate
```

签名脚本还会自动刷新 `release/SHA256SUMS.txt` 和 `release/SIGNATURE-REPORT.txt`。签名后再次修改可执行文件会使验证失败。
