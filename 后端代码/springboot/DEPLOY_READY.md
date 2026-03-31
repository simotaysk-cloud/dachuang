# Backend Deploy Ready

## 已准备完成

- 后端打包产物：
  - `target/dachuang-0.0.1-SNAPSHOT.jar`
- 本地 AI 配置：
  - `.env`
- 本地启动脚本：
  - `scripts/dev-run.sh`
  - `scripts/dev-run-bg.sh`
- 远程部署脚本：
  - `scripts/deploy-remote.sh`

## 当前功能包含

- 智问页请求腾讯混元兼容接口
- 溯源页可带当前批次上下文进入智问
- 后端 AI 请求支持 `traceContext`

## 服务器手动部署命令

如果 SSH 恢复正常，优先执行：

```bash
cd /root
fuser -k 8091/tcp 2>/dev/null || true
sleep 2
nohup env AI_API_KEY='你的混元API Key' java -jar /root/dachuang-0.0.1-SNAPSHOT.jar \
  --spring.profiles.active=dev \
  --app.mock-data.enabled=true \
  --app.mock-data.force=true \
  > /root/backend.log 2>&1 &
```

## 本地上传命令

先上传 jar：

```bash
scp target/dachuang-0.0.1-SNAPSHOT.jar root@cpuzhbc.cn:/root/
```

再登录服务器执行上面的启动命令。

## 启动后检查

```bash
tail -n 50 /root/backend.log
ps aux | grep dachuang-0.0.1-SNAPSHOT.jar | grep -v grep
curl http://127.0.0.1:8091/api/v1/trace/HT20250815-ZJ001
```

## 备注

- 当前 SSH 从外部连接会在握手阶段被服务器关闭，不是代码问题。
- 若要远程自动部署，需要先修复服务器的 SSH 登录策略。
