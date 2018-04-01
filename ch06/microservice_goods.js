const business = require('../ch05/monolithic_goods.js')

// Server클래스 참조
class goods extends require('./server.js') {
  constructor () {
    // 초기화
    super(
      "goods"
      , process.argv[2] ? Number(process.argv[2]) : 9010
      , ["POST/goods", "GET/goods", "DELETE/goods"]
    )

    // Distributor 연결
    this.connectToDistributor("127.0.0.1", 9000, (data) => {
      console.log("Distributor Notification", data);
    })
  }
  // 클라이언트 요청에 따른 비즈니스로직 호출
  onRead(socket, data) {
    console.log("onRead", socket.remoteAddress, socket.remotePort, data)
    business.onRequest(socket, data.method, data.uri, data.params, (s, packet) => {
      // 응답 패킷 전송
      socket.write(JSON.stringify(packet) + '¶')
    })
  }
}

// 인스턴스 생성
new goods()