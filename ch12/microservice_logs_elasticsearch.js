const cluster = require('cluster')
const fs = require('fs')                         // fs 모듈 로드
// elasticsearch 인스턴스 생성
const elasticsearch = new require('elasticsearch').Client({
  host: '127.0.0.1:9200',
  log: 'trace'
})

class logs extends require('./server.js') {
  constructor () {
    super(                                      // 1. POST/logs 한가지 기능만 가지도록 함
      "logs"
      , process.argv[2] ? Number(process.argv[2]) : 9040
      , ["POST/logs"]
    )
    this.writestream = fs.createWriteStream('./log.txt', { flags: 'a' })    // writestream 생성
    this.connectToDistributor("127.0.0.1", 9000, (data) => {
      console.log("Distributor Notification", data);
    })
  }

  onRead(socket, data) {                        // 2. 로그가 입력되면 화면에 출력
    const sz = new Date().toLocaleString() + '\t' + socket.remoteAddress + '\t' + socket.remotePort + '\t' + JSON.stringify(data) + '\n'
    console.log(sz)
    this.writestream.write(sz)                  // 로그 파일 저장
    data.timestamp = new Date().toISOString()   // timestamp 설정
    data.params = JSON.parse(data.params)       // JSON 포맷 변환
    elasticsearch.index({
      index: 'microservice',
      type: 'logs',
      body: data
    })
  }
}

if (cluster.isMaster) {
  cluster.fork()

  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`)
    cluster.fork()
  })
} else {
  new logs()
}