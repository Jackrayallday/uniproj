// generateUsers.js
const fs = require('fs');
const bcrypt = require('bcrypt');
const path = require('path');

const usersPath = path.join(__dirname, 'data', 'users.json');
const aclPath = path.join(__dirname, 'data', 'acl.json');

const users = [
  // Students
  { email: "tiger.woods@golf.com", password: "woods123", role: "student" },
  { email: "phil.mickelson@golf.com", password: "lefty456", role: "student" },
  { email: "rory.mcilroy@golf.com", password: "rory789", role: "student" },
  { email: "jeffreychristensen@lawson-ramirez.com", password: "jeff123", role: "student" },
  { email: "cheryl16@thompson.org", password: "cheryl123", role: "student" },
  { email: "vazquezrobert@jacobson.com", password: "robert123", role: "student" },
  { email: "vancechristina@martinez.com", password: "christina123", role: "student" },
  { email: "dgonzalez@morgan-mathews.com", password: "gonzalez123", role: "student" },

  // Instructors
  { email: "babe.ruth@mlb.com", password: "ruth456", role: "instructor" },
  { email: "ken.griffey@mlb.com", password: "swingman1", role: "instructor" },
  { email: "mike.trout@mlb.com", password: "troutpower", role: "instructor" },
  { email: "kenneth59@gmail.com", password: "kenneth123", role: "instructor" },
  { email: "jcampbell@gmail.com", password: "campbell123", role: "instructor" },
  { email: "timothyrobinson@guzman-murray.com", password: "timothy123", role: "instructor" },

  // Admins
  { email: "shohei.ohtani@mlb.com", password: "ohtani789", role: "admin" },
  { email: "jack.nicklaus@golf.com", password: "goldenbear", role: "admin" },
  { email: "hank.aaron@mlb.com", password: "755homeruns", role: "admin" },
  { email: "benjamindavis@carroll.org", password: "benjamin123", role: "admin" },
  { email: "marcus09@hotmail.com", password: "marcus123", role: "admin" }
];

const defaultPermissions = {
  student: { courses: ["read"] },
  instructor: { courses: ["read", "write"] },
  admin: { courses: ["read", "write", "delete"] }
};

const generate = async () => {
  const securedUsers = [];
  let existingACL = {};

  // Load existing ACL if it exists
  if (fs.existsSync(aclPath)) {
    try {
      existingACL = JSON.parse(fs.readFileSync(aclPath, 'utf8'));
    } catch (err) {
      console.error("Failed to parse existing acl.json. Starting fresh.");
      existingACL = {};
    }
  }

  for (const user of users) {
    const hash = await bcrypt.hash(user.password, 10);
    securedUsers.push({
      email: user.email,
      passwordHash: hash,
      role: user.role
    });

    // Add to ACL if not present
    if (!existingACL[user.email]) {
      existingACL[user.email] = defaultPermissions[user.role] || {};
    }
  }

  fs.writeFileSync(usersPath, JSON.stringify(securedUsers, null, 2));
  console.log("users.json written.");

  fs.writeFileSync(aclPath, JSON.stringify(existingACL, null, 2));
  console.log("acl.json updated.");
};

generate().catch(err => {
  console.error("Generation failed:", err);
});
