const mysql = require('mysql')
const conn = {                                            // mysql 접속 정보
  host: 'localhost',
  user: 'micro',
  password: 'service',
  database: 'monolithic',
  multipleStatements: true                               // 상품 등록 후 아이디를 알아 올려고 설정
}

const redis = require("redis").createClient()            // redis 모듈 로드

redis.on("error", function (err) {                       // redis 에러 처리
  console.log("Redis Error " + err)
})

exports.onRequest = function (res, method, pathname, params, cb) {
  switch (method) {                                       // 메서드별로 기능 분기
    case "POST":
      return register(method, pathname, params, (response) => { process.nextTick(cb, res, response) })
    case "GET":
      return inquiry(method, pathname, params, (response) => { process.nextTick(cb, res, response) })
    case "DELETE":
      return unregister(method, pathname, params, (response) => { process.nextTick(cb, res, response) })
    default:
      return process.nextTick(cb, res, null)
  }
}

function register (method, pathname, params, cb) {
  var response = {
    key: params.key,
    errorcode: 0,
    errormessage: 'success'
  }

  if (params.name == null || params.category == null || params.price == null || params.description == null) {   // 유효성 검사
    response.errorcode = 1
    response.errormessage = "Invalid Parameters"
    cb(response)
  } else {
    var connection = mysql.createConnection(conn)
    connection.connect()
    connection.query("insert into goods(name, category, price, description) values(? ,? ,? ,?); select LAST_INSERT_ID() as id;"
      , [params.name, params.category, params.price, params.description]
      , (error, results, fields) => {
        if (error) {                                                                                            // mysql 에러 처리
          response.errorcode = 1
          response.errormessage = error
        } else {
          const id = results[1][0].id
          redis.set(id, JSON.stringify(params))   // Redis 등록
        }
        cb(response)
      }
    )
    connection.end()
  }
}

function inquiry (method, pathname, params, cb) {
  var response = {
    key: params.key,
    errorcode: 0,
    errormessage: 'success'
  }

  var connection = mysql.createConnection(conn)
  connection.connect()
  connection.query("select * from goods", (error, results, fields) => {
    if (error || results.length == 0) {
      response.errorcode = 1
      // 등록된 상품이 없을 시 처리
      response.errormessage = error ? error : "no data"
    } else {
      response.results = results                                                                                // 조회 결과 처리
    }
    cb(response)
  })
  connection.end()
}

function unregister (method, pathname, params, cb) {
  var response = {
    key: params.key,
    errorcode: 0,
    errormessage: 'success'
  }

  if (params.id == null) {
    response.errorcode = 1
    response.errormessage = "Invalid Parameters"
    cb(response)
  } else {
    var connection = mysql.createConnection(conn)
    connection.connect()
    connection.query("delete from goods where id = ?"
      , [params.id]
      , (error, results, fields) => {
        if (error) {                                                                                            // mysql 에러 처리
          response.errorcode = 1
          response.errormessage = error
        } else {
          redis.del(params.id)            // redis 삭제
        }
        cb(response)
      }
    )
    connection.end()
  }
}