# mteam-pt-downloader

一个零依赖（不需要 npm install）的 Node.js CLI：
- 搜索 M-Team 种子
- 获取下载链接（genDlToken）
- 下载 `.torrent` 文件到本地

## 运行环境
- Node.js >= 18（建议 20+）

## 配置
复制环境变量示例：

```bash
cp .env.example .env
```

编辑 `.env`：
- `MTEAM_API_KEY`：你的 API Key（通过 `x-api-key` 头传递）
- `DOWNLOAD_DIR`：保存 `.torrent` 的目录（默认 `./downloads`）

## 用法

### 1) 验证配置/Key

```bash
node src/cli.js doctor
```

### 2) 搜索

```bash
node src/cli.js search --keyword "哪吒" --mode movie --page 1 --pageSize 20
```

### 3) 下载指定 torrentId

```bash
node src/cli.js download --id 123456
```

### 4) 先搜后下（下载搜索结果中的第 N 个）

```bash
node src/cli.js download --keyword "哪吒" --pick 1 --mode movie
```

下载成功后会输出本地文件路径。

## 说明
- API Base URL 默认 `https://api.m-team.cc`
- 搜索接口：`POST /api/torrent/search`（JSON）
- 下载链接接口：`POST /api/torrent/genDlToken`（x-www-form-urlencoded）
