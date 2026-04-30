const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "json_panic.db");

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Database connection error:", err.message);
  } else {
    console.log("Connected to SQLite database");
  }
});

db.serialize(() => {
  db.run(`
   CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  email_verified INTEGER DEFAULT 0,
  email_verification_token TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS servers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      category TEXT NOT NULL,
      reward_name TEXT NOT NULL,
      reward_icon TEXT NOT NULL,
      is_demo INTEGER DEFAULT 0,
      order_number INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS levels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      server_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      file_name TEXT NOT NULL,
      description TEXT,
      difficulty TEXT NOT NULL,
      mode TEXT NOT NULL,
      order_number INTEGER NOT NULL,
      correct_json TEXT NOT NULL,
      broken_json TEXT NOT NULL,
      hints TEXT,
      explanation TEXT,
      error_type TEXT,
      time_limit INTEGER DEFAULT 0,
      max_score INTEGER DEFAULT 100,
      stability_reward INTEGER DEFAULT 20,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(server_id) REFERENCES servers(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS game_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      server_id INTEGER NOT NULL,
      level_id INTEGER NOT NULL,
      score INTEGER DEFAULT 0,
      attempts INTEGER DEFAULT 0,
      hints_used INTEGER DEFAULT 0,
      completed INTEGER DEFAULT 0,
      completion_time INTEGER DEFAULT 0,
      server_stability INTEGER DEFAULT 0,
      mode TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(server_id) REFERENCES servers(id),
      FOREIGN KEY(level_id) REFERENCES levels(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS server_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      server_id INTEGER NOT NULL,
      completed_levels INTEGER DEFAULT 0,
      total_levels INTEGER DEFAULT 0,
      stability INTEGER DEFAULT 0,
      total_score INTEGER DEFAULT 0,
      crown TEXT DEFAULT '',
      completed INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, server_id),
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(server_id) REFERENCES servers(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      icon TEXT DEFAULT '🏅',
      condition_type TEXT,
      condition_value INTEGER
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS user_achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      achievement_id INTEGER NOT NULL,
      earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, achievement_id),
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(achievement_id) REFERENCES achievements(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  seedServersAndLevels();
  seedAchievements();
});

function insertLevel(serverId, orderNumber, level) {
  db.run(
    `
    INSERT INTO levels (
      server_id, title, file_name, description, difficulty, mode,
      order_number, correct_json, broken_json, hints, explanation,
      error_type, time_limit, max_score, stability_reward
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      serverId,
      level.title,
      level.file,
      level.description,
      level.difficulty,
      level.mode,
      orderNumber,
      JSON.stringify(level.correct, null, 2),
      level.broken,
      JSON.stringify(level.hints),
      level.explanation,
      level.error_type,
      level.time_limit,
      level.max_score,
      level.stability_reward
    ]
  );
}

function seedServersAndLevels() {
  db.get(`SELECT COUNT(*) as count FROM servers`, (err, row) => {
    if (err) return;

    if (row.count > 0) {
      return;
    }

    const servers = [
      {
        title: "Demo Server",
        description: "Навчальний сервер для гостей. Тут можна спробувати гру без збереження прогресу.",
        difficulty: "demo",
        category: "training",
        reward_name: "Перший запуск",
        reward_icon: "🧪",
        is_demo: 1,
        order: 1,
        levels: [
          {
            title: "Demo Config",
            file: "demo-config.json",
            description: "Виправ просту конфігурацію демо-сервера.",
            difficulty: "easy",
            mode: "training",
            correct: {
              service: "demo",
              enabled: true,
              port: 3000
            },
            broken: `{
  "service": "demo",
  "enabled": True,
  "port": "3000",
}`,
            hints: [
              "true у JSON пишеться маленькими літерами.",
              "port має бути числом.",
              "В останньому полі не ставиться кома."
            ],
            explanation: "Помилки стосуються boolean-значення, типу числа та зайвої коми.",
            error_type: "boolean,type,comma",
            time_limit: 0,
            max_score: 80,
            stability_reward: 100
          }
        ]
      },
      {
        title: "Auth Server",
        description: "Сервер авторизації не запускається. Потрібно відновити конфіги входу, маршрутів і токенів.",
        difficulty: "easy",
        category: "backend",
        reward_name: "Auth Restorer",
        reward_icon: "🟢",
        is_demo: 0,
        order: 2,
        levels: [
          {
            title: "Auth Config",
            file: "auth-config.json",
            description: "Віднови основну конфігурацію авторизації.",
            difficulty: "easy",
            mode: "training",
            correct: {
              service: "auth",
              port: 8080,
              enabled: true
            },
            broken: `{
  "service": "auth",
  "port": "8080"
  "enabled": True,
}`,
            hints: [
              "Між port і enabled немає коми.",
              "port має бути числом.",
              "True має бути true.",
              "Зайва кома в кінці."
            ],
            explanation: "Потрібно виправити кому, тип port і boolean.",
            error_type: "syntax,type,boolean",
            time_limit: 0,
            max_score: 100,
            stability_reward: 34
          },
          {
            title: "Login Routes",
            file: "login-routes.json",
            description: "Віднови маршрути входу користувачів.",
            difficulty: "easy",
            mode: "classic",
            correct: {
              routes: [
                { path: "/login", method: "POST" },
                { path: "/logout", method: "POST" }
              ]
            },
            broken: `{
  "routes": [
    { "path": "/login", "method": "POST" }
    { "path": "/logout", "method": "POST", }
  ]
}`,
            hints: [
              "Між об'єктами масиву потрібна кома.",
              "У другому об'єкті зайва кома.",
              "Перевір масив routes."
            ],
            explanation: "JSON-масив потребує коми між елементами.",
            error_type: "array,comma",
            time_limit: 0,
            max_score: 120,
            stability_reward: 33
          },
          {
            title: "Token Settings",
            file: "token-settings.json",
            description: "Віднови налаштування JWT-токенів.",
            difficulty: "easy",
            mode: "timed",
            correct: {
              token: {
                expiresIn: 3600,
                refresh: true,
                algorithm: "HS256"
              }
            },
            broken: `{
  "token": {
    "expiresIn": "3600",
    "refresh": True,
    "algorithm": HS256
  }
}`,
            hints: [
              "expiresIn має бути числом.",
              "True має бути true.",
              "HS256 має бути рядком у лапках."
            ],
            explanation: "Тут помилки типів даних і лапок.",
            error_type: "type,boolean,string",
            time_limit: 90,
            max_score: 140,
            stability_reward: 33
          }
        ]
      },
      {
        title: "Database Server",
        description: "База даних не підключається через пошкоджені JSON-конфіги.",
        difficulty: "easy",
        category: "database",
        reward_name: "DB Fixer",
        reward_icon: "🟢",
        is_demo: 0,
        order: 3,
        levels: [
          {
            title: "Connection Config",
            file: "connection.json",
            description: "Виправ параметри підключення до бази.",
            difficulty: "easy",
            mode: "classic",
            correct: {
              database: {
                host: "localhost",
                port: 5432,
                ssl: false
              }
            },
            broken: `{
  database: {
    "host": "localhost",
    "port": "5432",
    "ssl": False
  }
}`,
            hints: [
              "Ключ database має бути в лапках.",
              "port має бути числом.",
              "False має бути false."
            ],
            explanation: "JSON вимагає лапок у ключах і нижнього регістру для boolean.",
            error_type: "quotes,type,boolean",
            time_limit: 0,
            max_score: 120,
            stability_reward: 34
          },
          {
            title: "Backup Settings",
            file: "backup-settings.json",
            description: "Віднови налаштування резервного копіювання.",
            difficulty: "medium",
            mode: "classic",
            correct: {
              backup: {
                enabled: true,
                intervalHours: 24,
                targets: ["users", "orders"]
              }
            },
            broken: `{
  "backup": {
    "enabled": "true",
    "intervalHours": "24",
    "targets": ["users" "orders"]
  }
}`,
            hints: [
              "enabled має бути boolean.",
              "intervalHours має бути числом.",
              "У масиві targets пропущена кома."
            ],
            explanation: "Помилки типів і пропущена кома у масиві.",
            error_type: "type,array",
            time_limit: 0,
            max_score: 150,
            stability_reward: 33
          },
          {
            title: "Pool Settings",
            file: "pool.json",
            description: "Виправ налаштування пулу підключень.",
            difficulty: "medium",
            mode: "timed",
            correct: {
              pool: {
                min: 2,
                max: 10,
                idleTimeout: 30000
              }
            },
            broken: `{
  "pool": {
    "min": 2,
    "max": "10",
    "idleTimeout": 30000,
  }
}`,
            hints: [
              "max має бути числом.",
              "У кінці idleTimeout є зайва кома."
            ],
            explanation: "Потрібно виправити тип max та зайву кому.",
            error_type: "type,comma",
            time_limit: 100,
            max_score: 160,
            stability_reward: 33
          }
        ]
      },
      {
        title: "API Gateway",
        description: "API Gateway не може завантажити маршрути, CORS і проксі-конфігурацію.",
        difficulty: "medium",
        category: "api",
        reward_name: "Route Engineer",
        reward_icon: "🔵",
        is_demo: 0,
        order: 4,
        levels: [
          {
            title: "Routes",
            file: "routes.json",
            description: "Віднови список API-маршрутів.",
            difficulty: "medium",
            mode: "classic",
            correct: {
              routes: [
                { path: "/users", method: "GET" },
                { path: "/orders", method: "POST" }
              ]
            },
            broken: `{
  "routes": [
    { "path": "/users", "method": "GET" },
    { "path": "/orders", method: "POST" }
  ]
}`,
            hints: [
              "У другому об'єкті ключ method без лапок."
            ],
            explanation: "Ключі JSON завжди мають бути в подвійних лапках.",
            error_type: "quotes",
            time_limit: 0,
            max_score: 150,
            stability_reward: 25
          },
          {
            title: "Rate Limit",
            file: "rate-limit.json",
            description: "Віднови правила обмеження запитів.",
            difficulty: "medium",
            mode: "timed",
            correct: {
              rateLimit: {
                enabled: true,
                maxRequests: 100,
                windowSeconds: 60
              }
            },
            broken: `{
  "rateLimit": {
    "enabled": true,
    "maxRequests": "100"
    "windowSeconds": "60"
  }
}`,
            hints: [
              "Після maxRequests потрібна кома.",
              "maxRequests і windowSeconds мають бути числами."
            ],
            explanation: "Помилка коми і типів даних.",
            error_type: "comma,type",
            time_limit: 100,
            max_score: 180,
            stability_reward: 25
          },
          {
            title: "CORS Policy",
            file: "cors-policy.json",
            description: "Виправ CORS-політику.",
            difficulty: "medium",
            mode: "classic",
            correct: {
              cors: {
                origins: ["http://localhost:5500"],
                credentials: true
              }
            },
            broken: `{
  "cors": {
    "origins": ["http://localhost:5500",],
    "credentials": True
  }
}`,
            hints: [
              "У масиві origins зайва кома.",
              "True має бути true."
            ],
            explanation: "Потрібно прибрати зайву кому й виправити boolean.",
            error_type: "comma,boolean",
            time_limit: 0,
            max_score: 160,
            stability_reward: 25
          },
          {
            title: "Proxy Config",
            file: "proxy-config.json",
            description: "Виправ проксі-конфігурацію.",
            difficulty: "medium",
            mode: "timed",
            correct: {
              proxy: {
                target: "http://backend:5000",
                timeout: 5000,
                secure: false
              }
            },
            broken: `{
  "proxy": {
    "target": http://backend:5000,
    "timeout": "5000",
    "secure": False
  }
}`,
            hints: [
              "target має бути рядком у лапках.",
              "timeout має бути числом.",
              "False має бути false."
            ],
            explanation: "Типові помилки рядка, числа і boolean.",
            error_type: "string,type,boolean",
            time_limit: 120,
            max_score: 190,
            stability_reward: 25
          }
        ]
      },
      {
        title: "Payment Server",
        description: "Платіжна система не може обробляти транзакції через пошкоджені конфіги.",
        difficulty: "hard",
        category: "payment",
        reward_name: "Payment Guardian",
        reward_icon: "🟣",
        is_demo: 0,
        order: 5,
        levels: [
          {
            title: "Gateway Config",
            file: "payment-gateway.json",
            description: "Виправ шлюз платежів.",
            difficulty: "hard",
            mode: "timed",
            correct: {
              gateway: {
                provider: "Stripe",
                retries: 3,
                sandbox: false
              }
            },
            broken: `{
  "gateway": {
    "provider": Stripe,
    "retries": "3",
    "sandbox": False
  }
}`,
            hints: [
              "provider має бути рядком.",
              "retries має бути числом.",
              "False має бути false."
            ],
            explanation: "Помилки типів у конфігурації шлюзу.",
            error_type: "string,type,boolean",
            time_limit: 120,
            max_score: 220,
            stability_reward: 20
          },
          {
            title: "Currency Rules",
            file: "currency-rules.json",
            description: "Віднови правила валют.",
            difficulty: "hard",
            mode: "classic",
            correct: {
              currencies: ["USD", "EUR", "UAH"],
              default: "UAH"
            },
            broken: `{
  "currencies": ["USD", "EUR" "UAH"],
  "default": UAH
}`,
            hints: [
              "У масиві пропущена кома.",
              "UAH має бути рядком у лапках."
            ],
            explanation: "Помилки масиву та рядкового значення.",
            error_type: "array,string",
            time_limit: 0,
            max_score: 200,
            stability_reward: 20
          },
          {
            title: "Fraud Check",
            file: "fraud-check.json",
            description: "Виправ антифрод-налаштування.",
            difficulty: "hard",
            mode: "timed",
            correct: {
              fraudCheck: {
                enabled: true,
                threshold: 0.85,
                blockRisky: true
              }
            },
            broken: `{
  "fraudCheck": {
    "enabled": "true",
    "threshold": "0.85",
    "blockRisky": True,
  }
}`,
            hints: [
              "enabled має бути boolean.",
              "threshold має бути числом.",
              "True має бути true.",
              "В кінці зайва кома."
            ],
            explanation: "Комбінація типових помилок складнішого рівня.",
            error_type: "type,boolean,comma",
            time_limit: 130,
            max_score: 240,
            stability_reward: 20
          }
        ]
      }
    ];

    servers.forEach((server) => {
      db.run(
        `
        INSERT INTO servers (
          title, description, difficulty, category,
          reward_name, reward_icon, is_demo, order_number
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          server.title,
          server.description,
          server.difficulty,
          server.category,
          server.reward_name,
          server.reward_icon,
          server.is_demo,
          server.order
        ],
        function (err) {
          if (err) return;

          const serverId = this.lastID;

          server.levels.forEach((level, index) => {
            insertLevel(serverId, index + 1, level);
          });
        }
      );
    });

    console.log("Default servers and levels inserted");
  });
}

function seedAchievements() {
  db.get(`SELECT COUNT(*) as count FROM achievements`, (err, row) => {
    if (err) return;

    if (row.count > 0) {
      return;
    }

    const achievements = [
      ["Перший ремонт", "Пройти перший JSON-файл", "🔧", "completed_levels", 1],
      ["Стабілізатор", "Відновити перший сервер", "🖥️", "completed_servers", 1],
      ["Без підказок", "Пройти JSON без підказок", "🧠", "no_hints", 1],
      ["Швидкий дебагер", "Пройти JSON швидше ніж за 60 секунд", "⚡", "fast_level", 60],
      ["Король конфігів", "Отримати першу золоту корону", "👑", "gold_crown", 1],
      ["Серверний рятівник", "Відновити 5 серверів", "🚀", "completed_servers", 5]
    ];

    achievements.forEach((achievement) => {
      db.run(
        `
        INSERT INTO achievements (
          name, description, icon, condition_type, condition_value
        ) VALUES (?, ?, ?, ?, ?)
        `,
        achievement
      );
    });

    console.log("Default achievements inserted");
  });
}

module.exports = db;