const business = require('../ch05/monolithic_purchases.js')

// Server클래스 참조
class purchases extends require('./server.js') {
  constructor () {
    // 초기화
    super(
      "purchases"
      , process.argv[2] ? Number(process.argv[2]) : 9030
      , ["POST/purchases", "GET/purchases"]
    )

    // Distributor 연결
    this.connectToDistributor("127.0.0.1", 9000, (data) => {
      console.log("Distributor Notification", data);
    })
  }
  // 클라이언트 요청에 따른 비즈니스로직 호출
  onRead(socket, data) {
    console.log("onRead", socket.remoteAddress, socket.remotePort, data);
    business.onRequest(socket, data.method, data.uri, data.params, (s, packet) => {
      // 응답 패킷 전송
      socket.write(JSON.stringify(packet) + '¶')
    })
  }
}

// 인스턴스 생성
new purchases()