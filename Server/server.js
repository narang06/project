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

app.get('/clients/insert', async (req, res) => {
    const { 
        username,
        password,
        name,
        phone,
        email,
        currentAddress,
        birthDate,
        gender
    } = req.query;

    try {
        await connection.execute(
            `INSERT INTO CLIENTS (
                CLIENT_ID,
                USERNAME,
                PASSWORD,
                NAME,
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
                phone,
                email,
                currentAddress,
                birthDate,
                gender,
                role: 1,               // 기본 권한 예: 1 = 일반 회원 추후 권한은 관리자가 변경 가능하게
                status: 'ACTIVE'       // 기본 상태 예: 'ACTIVE'
            },
            { autoCommit: true }
        );

        res.json({ result: "success" });
    } catch (error) {
        console.error('Error executing insert', error);
        res.status(500).send('Error executing insert');
    }
});

app.get('/clients/check-username', async (req, res) => { // 아이디 중복 체크
    const { username } = req.query;

    try {
        const result = await connection.execute(
            `SELECT COUNT(*) AS CNT FROM CLIENTS WHERE username = :username`,
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

app.get('/login', async (req, res) => {
  const { username, pwd } = req.query;
  let query = `SELECT * FROM CLIENTS WHERE USERNAME = '${username}' AND PASSWORD = '${pwd}'`
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
    res.json(rows);
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).send('Error executing query');
  }
});

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

// 서버 시작
app.listen(3009, () => {
  console.log('Server is running on port 3009');
});