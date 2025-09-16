const express = require('express');
const cors = require('cors');
const path = require('path');
const oracledb = require('oracledb');

const app = express();
app.use(cors());

// ejs 설정
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '.')); // .은 경로

const config = {
  user: 'SYSTEM',
  password: 'test1234',
  connectString: 'localhost:1521/xe'
};

// Oracle 데이터베이스와 연결을 유지하기 위한 전역 변수
let connection;

// 데이터베이스 연결 설정
async function initializeDatabase() {
  try {
    connection = await oracledb.getConnection(config);
    console.log('Successfully connected to Oracle database');
  } catch (err) {
    console.error('Error connecting to Oracle database', err);
  }
}

initializeDatabase();

// 엔드포인트
app.get('/', (req, res) => {
  res.send('Hello World');
});

// 회원 가입
app.get('/clients/insert', async (req, res) => {
    const { 
        username,
        password,
        name,
        nickname,
        phone,
        email,
        currentAddress,
        birthDate,
        gender,
        role
    } = req.query;

    try {
        await connection.execute(
            `INSERT INTO CLIENTS (
                CLIENT_ID,
                USERNAME,
                PASSWORD,
                NAME,
                NICKNAME,
                PHONE_NUMBER,
                EMAIL,
                CURRENT_ADDRESS,
                DATE_OF_BIRTH,
                GENDER,
                ROLE,
                STATUS,
                JOIN_DATE
            ) VALUES (
                CLIENTS_SEQ.NEXTVAL,
                :username,
                :password,
                :name,
                :nickname,
                :phone,
                :email,
                :currentAddress,
                TO_DATE(:birthDate, 'YYYY-MM-DD'),
                :gender,
                :role,
                :status,
                SYSDATE
            )`,
            {
                username,
                password,
                name,
                nickname,
                phone,
                email,
                currentAddress,
                birthDate,
                gender,
                role,               
                status: '활성'
            },
            { autoCommit: true }
        );

        res.json({ result: "success" });
    } catch (error) {
        console.error('Error executing insert', error);
        res.status(500).send('Error executing insert');
    }
});

//아이디 중복 체크
app.get('/clients/check-username', async (req, res) => {
    const { username } = req.query;

    try {
        const result = await connection.execute(
            `SELECT COUNT(*) AS CNT FROM CLIENTS WHERE USERNAME = :username`,
            [username]
        );

        const count = result.rows[0][0];
        if(count > 0) {
            res.json({ exists: true });
        } else {
            res.json({ exists: false });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});
// 로그인 
app.get('/login', async (req, res) => {
  const { username, pwd } = req.query;

  try {
    const result = await connection.execute(
      `SELECT * FROM CLIENTS WHERE USERNAME = :username AND PASSWORD = :pwd`,
      { username, pwd },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (result.rows.length === 0) {
      return res.json([]); 
    }

    const user = result.rows[0];

    await connection.execute(
      `UPDATE CLIENTS
       SET LOGIN_COUNT = NVL(LOGIN_COUNT,0) + 1,
           LAST_LOGIN_DATE = SYSDATE
       WHERE CLIENT_ID = :clientId`,
      { clientId: user.CLIENT_ID },
      { autoCommit: true }
    );

    res.json([user]);

  } catch (error) {
    console.error('Error executing login', error);
    res.status(500).send('Error executing login');
  }
});
// 로그인 유저 정보
app.get('/user-info', async (req, res) => {
    const { sessionId } = req.query;
    if (!sessionId) {
        return res.status(400).send('Session ID is required');
    }
    try {
        const query = `SELECT CLIENT_ID, NAME, ROLE, STATUS FROM CLIENTS WHERE CLIENT_ID = :sessionId`;
        const result = await connection.execute(query, [sessionId]);
        
        const columnNames = result.metaData.map(column => column.name);
        const rows = result.rows.map(row => {
            const obj = {};
            columnNames.forEach((columnName, index) => {
                obj[columnName] = row[index];
            });
            return obj;
        });
        res.json(rows);
    } catch (error) {
        console.error('Error fetching user info', error);
        res.status(500).send('Error fetching user info');
    }
});

// 회원 목록 불러오기
app.get('/clients', async (req, res) => {
  const { } = req.query;
  try {
    const result = await connection.execute(`SELECT * FROM CLIENTS`);
    const columnNames = result.metaData.map(column => column.name);
    // 쿼리 결과를 JSON 형태로 변환
    const rows = result.rows.map(row => {
      // 각 행의 데이터를 컬럼명에 맞게 매핑하여 JSON 객체로 변환
      const obj = {};
      columnNames.forEach((columnName, index) => {
        obj[columnName] = row[index];
      });
      return obj;
    });
    res.json({
        result : "success",
        list : rows
    });
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).send('Error executing query');
  }
});

// 회원 정보 삭제
app.get('/clients/delete', async (req, res) => {
  const { clientId } = req.query;

  try {
    await connection.execute(
      `DELETE FROM CLIENTS WHERE CLIENT_ID = '${clientId}'`,
      [],
      { autoCommit: true }
    );
    res.json({
        result : "success"
    });
  } catch (error) {
    console.error('Error executing insert', error);
    res.status(500).send('Error executing insert');
  }
});

// 회원정보를 가져오기
app.get('/client/info', async (req, res) => {
  const { clientId } = req.query;
  try {
    let query = `
      SELECT C.*, 
      USERNAME "username",
      NAME "name",
      PHONE_NUMBER "phoneNumber",
      CURRENT_ADDRESS "cAddr",
      GENDER "gender",
      EMAIL "email",
      ROLE "role",
      STATUS "status",
      PREFERRED_PROPERTY_TYPE "prePropertyType",
      BUDGET "budget",
      PREFERRED_AREA "preArea",
      TO_CHAR(DATE_OF_BIRTH, 'YYYY-MM-DD') "birth",
      NICKNAME "nickName",
      TO_CHAR(JOIN_DATE,'YYYY-MM-DD') "joinDate",
      TO_CHAR(LAST_LOGIN_DATE,'YYYY-MM-DD HH24:MI:SS') "lastLogin",
      LOGIN_COUNT "loginCount"
      FROM CLIENTS C
      WHERE CLIENT_ID = ${clientId}
      `;

    const result = await connection.execute(query);
    const columnNames = result.metaData.map(column => column.name);
    // 쿼리 결과를 JSON 형태로 변환
    const rows = result.rows.map(row => {
      // 각 행의 데이터를 컬럼명에 맞게 매핑하여 JSON 객체로 변환
      const obj = {};
      columnNames.forEach((columnName, index) => {
        obj[columnName] = row[index];
      });
      return obj;
    });
    // 리턴
    res.json({
        result : "success",
        info : rows[0]
    });
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).send('Error executing query');
  }
});

//회원정보 업데이트
app.get('/client/update', async (req, res) => {
  const {
    clientId,
    name,
    email,
    nickName,
    phoneNumber,
    birth,
    cAddr,
    gender,
    role,
    status,
    budget,
    preArea,
    prePropertyType
  } = req.query;

  try {
    let query = `UPDATE CLIENTS SET 
      NAME = '${name}',
      EMAIL = '${email}',
      NICKNAME = '${nickName}',
      PHONE_NUMBER = '${phoneNumber}',
      DATE_OF_BIRTH = '${birth}',
      CURRENT_ADDRESS = '${cAddr}',
      GENDER = '${gender}',
      ROLE = '${role}',
      STATUS = '${status}',
      BUDGET = '${budget}',
      PREFERRED_AREA = '${preArea}',
      PREFERRED_PROPERTY_TYPE = '${prePropertyType}'
      WHERE CLIENT_ID = ${clientId}`;
    
    await connection.execute(query, [], { autoCommit: true });

    res.json({
      result: "success"
    });
  } catch (error) {
    console.error('Error executing update', error);
    res.status(500).send('Error executing update');
  }
});

// 매물 리스트
app.get('/properties', async (req, res) => {
  const { } = req.query;
  let query = `SELECT PROPERTY_ID, ADDRESS, PROPERTY_TYPE, AREA, PRICE, STATUS FROM PROPERTIES ORDER BY PROPERTY_ID DESC`
  try {
    const result = await connection.execute(query);
    const columnNames = result.metaData.map(column => column.name);
    // 쿼리 결과를 JSON 형태로 변환
    const rows = result.rows.map(row => {
      // 각 행의 데이터를 컬럼명에 맞게 매핑하여 JSON 객체로 변환
      const obj = {};
      columnNames.forEach((columnName, index) => {
        obj[columnName] = row[index];
      });
      return obj;
    });
    res.json({
        result : "success",
        list : rows
    });
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).send('Error executing query');
  }
});

// 매물 삭제
app.get('/properties/delete', async (req, res) => {
  const { propertyId } = req.query;

  try {
    await connection.execute(
      `DELETE FROM PROPERTIES WHERE PROPERTY_ID = '${propertyId}'`,
      [],
      { autoCommit: true }
    );
    res.json({
        result : "success"
    });
  } catch (error) {
    console.error('Error executing insert', error);
    res.status(500).send('Error executing insert');
  }
});

// 매물 추가
app.get('/properties/insert', async (req, res) => {
  const { address, propertyType, buildYear, floor, area, price, sellerId, remarks } = req.query;

  try {
    const query = `
      INSERT INTO PROPERTIES 
      (PROPERTY_ID, ADDRESS, PROPERTY_TYPE, BUILD_YEAR, FLOOR, AREA, PRICE, SELLER_ID, REMARKS)
      VALUES (PROPERTIES_SEQ.NEXTVAL, :address, :propertyType, :buildYear, :floor, :area, :price, :sellerId, :remarks)
      `;

    await connection.execute(query, {
      address,
      propertyType,
      buildYear,
      floor,
      area,
      price,
      sellerId,
      remarks
    }, { autoCommit: true });

    res.json({ result: "success" });
  } catch (error) {
    console.error('Error inserting property', error);
    res.status(500).send('Error inserting property');
  }
});

// 매물 수정
app.get('/properties/update', async (req, res) => {
  const { 
    propertyId,
    address,
    propertyType,
    buildYear,
    floor,
    area,
    price,
    sellerId,
    remarks,
    status,
  } = req.query;
  
  try {
    const query = `UPDATE PROPERTIES SET 
      ADDRESS = :address,
      PROPERTY_TYPE = :propertyType,
      BUILD_YEAR = :buildYear,
      FLOOR = :floor,
      AREA = :area,
      PRICE = :price,
      SELLER_ID = :sellerId,
      STATUS = :status,
      REMARKS = :remarks
      WHERE PROPERTY_ID = :propertyId`;

    await connection.execute(
      query, 
      {
      address, propertyType, buildYear, floor, area, price, sellerId, status, remarks, propertyId
      }, 
      { autoCommit: true }
    );

    res.json({
      result: "success"
    });
  } catch (error) {
    console.error('Error executing update', error);
    res.status(500).send('Error executing update');
  }
});

// 매물 정보
app.get('/properties/info', async (req, res) => {
  const { propertyId } = req.query;

  const id = Number(propertyId);
  if (isNaN(id)) return res.status(400).send('Invalid propertyId');

  try {
    const result = await connection.execute(
      `SELECT P.*, 
              C.NAME AS "SELLER_NAME",
              P.ADDRESS "ADDRESS", 
              P.PROPERTY_TYPE "PROPERTY_TYPE", 
              P.BUILD_YEAR "BUILD_YEAR", 
              P.FLOOR "FLOOR", 
              P.AREA "AREA", 
              P.PRICE "PRICE", 
              P.SELLER_ID "SELLER_ID", 
              P.STATUS "STATUS", 
              P.REMARKS "REMARKS",
              TO_CHAR(P.REGISTRATION_DATE, 'YYYY-MM-DD') "REGISTRATION_DATE"
       FROM PROPERTIES P
       LEFT JOIN CLIENTS C ON P.SELLER_ID = C.CLIENT_ID
       WHERE P.PROPERTY_ID = :id`,
      [id]
    );

    const columnNames = result.metaData.map(column => column.name);

    const rows = result.rows.map(row => {
      const obj = {};
      columnNames.forEach((columnName, index) => {
        obj[columnName] = row[index];
      });
      return obj;
    });

    res.json({
      result: "success",
      info: rows[0] || null
    });
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).send('Error executing query');
  }
});



// 부동산 매매자 검색
app.get('/clients/sellers', async (req, res) => {
    try {
        const query = `SELECT CLIENT_ID, NAME FROM CLIENTS WHERE ROLE = 20`;
        const result = await connection.execute(query);
        const columnNames = result.metaData.map(col => col.name);
        const rows = result.rows.map(row => {
            const obj = {};
            columnNames.forEach((colName, idx) => obj[colName] = row[idx]);
            return obj;
        });
        res.json({ result: "success", list: rows });
    } catch (err) {
        console.error(err);
        res.status(500).send("서버 오류");
    }
});


// 서버 시작
app.listen(3009, () => {
  console.log('Server is running on port 3009');
});