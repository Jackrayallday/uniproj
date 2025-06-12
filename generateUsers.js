// generateUsers.js
const fs = require('fs');
const bcrypt = require('bcrypt');

const users = [
  {
    email: "tiger.woods@golf.com",
    password: "woods123",
    role: "student"
  },
  {
    email: "babe.ruth@mlb.com",
    password: "ruth456",
    role: "instructor"
  },
  {
    email: "shohei.ohtani@mlb.com",
    password: "ohtani789",
    role: "admin"
  }
];

const generate = async () => {
  const securedUsers = [];

  for (const user of users) {
    const hash = await bcrypt.hash(user.password, 10);
    securedUsers.push({
      email: user.email,
      passwordHash: hash,
      role: user.role
    });
  }

  fs.writeFileSync('./data/users.json', JSON.stringify(securedUsers, null, 2));
  console.log("✅ users.json created successfully.");
};

generate();
