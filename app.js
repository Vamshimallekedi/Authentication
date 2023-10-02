const express = require("express");
const app = express();

module.exports = app;
const path = require("path");
app.use(express.json());

const dbPath = path.join(__dirname, "userData.db");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const bcrypt = require("bcrypt");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3001, () => {
      console.log("server running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

app.post("/register", async (request, response) => {
  const userDetails = request.body;
  const { username, name, password, gender, location } = userDetails;

  if (password.length < 5) {
    response.status(400);
    response.send("Password is too short");
  } else {
    const hashedPassword = await bcrypt.hash(password, 10);
    const selectUserQuery = `
           SELECT *
           FROM user
           WHERE 
           username = '${username}';
         `;
    const dbUser = await db.get(selectUserQuery);

    if (dbUser === undefined) {
      //create user
      const createUserQuery = `
               INSERT INTO 
                  user (username , name , password , gender , location)
               VALUES 
                   ('${username}','${name}','${hashedPassword}','${gender}','${location}');
          `;
      await db.run(createUserQuery);
      response.status(200);
      response.send("User created successfully");
    } else {
      //user already exist
      response.status(400);
      response.send("User already exists");
    }
  }
});

app.post("/login", async (request, response) => {
  const userCredentials = request.body;
  const { username, password } = userCredentials;

  const selectUserQuery = `
        SELECT * 
        FROM user
        WHERE username = '${username}';
    `;
  const dbUser = await db.get(selectUserQuery);

  if (dbUser === undefined) {
    //Invalid user
    response.status(400);
    response.send("Invalid user");
  } else {
    //valid user
    const isPasswordMatches = await bcrypt.compare(password, dbUser.password);

    if (isPasswordMatches) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;

  const selectUserQuery = `
          SELECT * 
          FROM user
          WHERE
           username ='${username}';
      `;
  const dbUser = await db.get(selectUserQuery);

  if (bdUser === undefined) {
    response.status(400);
    response.send("User not registered");
  } else {
    const isPasswordMatches = await bcrypt.compare(
      oldPassword,
      dbUser.password
    );

    if (isPasswordMatches) {
      if (newPassword.length < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const updatePasswordQuery = `
                     UPDATE user
                     SET password ='${hashedPassword}'
                     WHERE username = '${username}';
                   `;
        await db.run(updatePasswordQuery);
        response.status(200);
        response.send("Password updated");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});
