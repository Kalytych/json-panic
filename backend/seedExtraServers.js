const db = require("./db");

function addServer(server, levels) {
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
      0,
      server.order_number
    ],
    function (err) {
      if (err) {
        console.error("Server insert error:", err.message);
        return;
      }

      const serverId = this.lastID;

      levels.forEach((level, index) => {
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
            level.file_name,
            level.description,
            level.difficulty,
            level.mode,
            index + 1,
            JSON.stringify(level.correct_json, null, 2),
            level.broken_json,
            JSON.stringify(level.hints),
            level.explanation,
            level.error_type,
            level.time_limit,
            level.max_score,
            level.stability_reward
          ]
        );
      });

      console.log("Added server:", server.title);
    }
  );
}

const extraServers = [
  {
    server: {
      title: "Monitoring Server",
      description: "Система моніторингу не бачить метрики серверів. Потрібно відновити JSON-конфігурації збору даних, алертів і дашбордів.",
      difficulty: "medium",
      category: "monitoring",
      reward_name: "Observer",
      reward_icon: "🔵",
      order_number: 6
    },
    levels: [
      {
        title: "Metrics Config",
        file_name: "metrics.json",
        description: "Виправ конфігурацію збору метрик.",
        difficulty: "medium",
        mode: "classic",
        correct_json: {
          metrics: {
            enabled: true,
            interval: 30,
            targets: ["cpu", "memory", "disk"]
          }
        },
        broken_json: `{
  "metrics": {
    "enabled": "true",
    "interval": "30",
    "targets": ["cpu", "memory" "disk"]
  }
}`,
        hints: [
          "enabled має бути boolean.",
          "interval має бути числом.",
          "У масиві targets пропущена кома."
        ],
        explanation: "Помилки пов’язані з типами даних і комою в масиві.",
        error_type: "type,array",
        time_limit: 0,
        max_score: 170,
        stability_reward: 34
      },
      {
        title: "Alerts Config",
        file_name: "alerts.json",
        description: "Виправ конфігурацію сповіщень.",
        difficulty: "medium",
        mode: "timed",
        correct_json: {
          alerts: {
            email: "admin@example.com",
            critical: true,
            retries: 3
          }
        },
        broken_json: `{
  "alerts": {
    "email": admin@example.com,
    "critical": True,
    "retries": "3"
  }
}`,
        hints: [
          "email має бути рядком.",
          "True має бути true.",
          "retries має бути числом."
        ],
        explanation: "Потрібно виправити рядок, boolean і число.",
        error_type: "string,boolean,type",
        time_limit: 100,
        max_score: 190,
        stability_reward: 33
      },
      {
        title: "Dashboard Config",
        file_name: "dashboard.json",
        description: "Виправ конфігурацію дашборду.",
        difficulty: "medium",
        mode: "classic",
        correct_json: {
          dashboard: {
            title: "Server Health",
            refreshSeconds: 15,
            public: false
          }
        },
        broken_json: `{
  "dashboard": {
    "title": "Server Health",
    "refreshSeconds": "15",
    "public": False,
  }
}`,
        hints: [
          "refreshSeconds має бути числом.",
          "False має бути false.",
          "В кінці зайва кома."
        ],
        explanation: "Помилки типів даних і зайва кома.",
        error_type: "type,boolean,comma",
        time_limit: 0,
        max_score: 180,
        stability_reward: 33
      }
    ]
  },
  {
    server: {
      title: "Cloud Storage Server",
      description: "Хмарне сховище не приймає файли через пошкоджені правила доступу, бакетів і CDN.",
      difficulty: "hard",
      category: "cloud",
      reward_name: "Cloud Keeper",
      reward_icon: "🟣",
      order_number: 7
    },
    levels: [
      {
        title: "Bucket Settings",
        file_name: "buckets.json",
        description: "Виправ налаштування бакетів.",
        difficulty: "hard",
        mode: "classic",
        correct_json: {
          bucket: {
            name: "uploads",
            public: false,
            maxSizeMb: 100
          }
        },
        broken_json: `{
  "bucket": {
    "name": uploads,
    "public": False,
    "maxSizeMb": "100"
  }
}`,
        hints: [
          "uploads має бути рядком.",
          "False має бути false.",
          "maxSizeMb має бути числом."
        ],
        explanation: "Типові помилки рядка, boolean і числа.",
        error_type: "string,boolean,type",
        time_limit: 0,
        max_score: 220,
        stability_reward: 34
      },
      {
        title: "Access Control",
        file_name: "access-control.json",
        description: "Виправ політику доступу.",
        difficulty: "hard",
        mode: "timed",
        correct_json: {
          access: {
            roles: ["admin", "editor", "viewer"],
            encrypted: true
          }
        },
        broken_json: `{
  "access": {
    "roles": ["admin", "editor" "viewer"],
    "encrypted": True
  }
}`,
        hints: [
          "У масиві roles пропущена кома.",
          "True має бути true."
        ],
        explanation: "Помилки у масиві та boolean.",
        error_type: "array,boolean",
        time_limit: 120,
        max_score: 230,
        stability_reward: 33
      },
      {
        title: "CDN Config",
        file_name: "cdn.json",
        description: "Виправ CDN-конфігурацію.",
        difficulty: "hard",
        mode: "timed",
        correct_json: {
          cdn: {
            enabled: true,
            ttl: 86400,
            region: "eu-central"
          }
        },
        broken_json: `{
  "cdn": {
    "enabled": "true",
    "ttl": "86400",
    "region": eu-central
  }
}`,
        hints: [
          "enabled має бути boolean.",
          "ttl має бути числом.",
          "region має бути рядком у лапках."
        ],
        explanation: "Помилки типів даних.",
        error_type: "type,string",
        time_limit: 120,
        max_score: 240,
        stability_reward: 33
      }
    ]
  },
  {
    server: {
      title: "Game Backend Server",
      description: "Ігровий бекенд втрачає сесії гравців, нагороди й дані лідерборду.",
      difficulty: "hard",
      category: "game",
      reward_name: "Game Core Engineer",
      reward_icon: "🟣",
      order_number: 8
    },
    levels: [
      {
        title: "Player Session",
        file_name: "player-session.json",
        description: "Виправ сесії гравців.",
        difficulty: "hard",
        mode: "classic",
        correct_json: {
          session: {
            timeout: 1800,
            persistent: true,
            maxDevices: 2
          }
        },
        broken_json: `{
  "session": {
    "timeout": "1800"
    "persistent": True,
    "maxDevices": "2"
  }
}`,
        hints: [
          "Після timeout потрібна кома.",
          "persistent має бути true.",
          "maxDevices має бути числом."
        ],
        explanation: "Помилка коми та типів даних.",
        error_type: "comma,boolean,type",
        time_limit: 0,
        max_score: 230,
        stability_reward: 34
      },
      {
        title: "Rewards Config",
        file_name: "rewards.json",
        description: "Виправ систему винагород.",
        difficulty: "hard",
        mode: "timed",
        correct_json: {
          rewards: {
            crowns: ["bronze", "silver", "gold"],
            bonusPoints: 50
          }
        },
        broken_json: `{
  "rewards": {
    "crowns": ["bronze", "silver" "gold"],
    "bonusPoints": "50",
  }
}`,
        hints: [
          "У масиві crowns пропущена кома.",
          "bonusPoints має бути числом.",
          "В кінці зайва кома."
        ],
        explanation: "Помилки масиву, числа і зайвої коми.",
        error_type: "array,type,comma",
        time_limit: 130,
        max_score: 250,
        stability_reward: 33
      },
      {
        title: "Anti-Cheat",
        file_name: "anti-cheat.json",
        description: "Виправ античіт-конфігурацію.",
        difficulty: "hard",
        mode: "timed",
        correct_json: {
          antiCheat: {
            enabled: true,
            scanInterval: 10,
            banOnCritical: false
          }
        },
        broken_json: `{
  "antiCheat": {
    "enabled": True,
    "scanInterval": "10",
    "banOnCritical": False
  }
}`,
        hints: [
          "True має бути true.",
          "scanInterval має бути числом.",
          "False має бути false."
        ],
        explanation: "Помилки boolean і числового типу.",
        error_type: "boolean,type",
        time_limit: 120,
        max_score: 260,
        stability_reward: 33
      }
    ]
  },
  {
    server: {
      title: "Security Server",
      description: "Система безпеки неправильно обробляє ролі, дозволи та JWT-політики.",
      difficulty: "expert",
      category: "security",
      reward_name: "Security Architect",
      reward_icon: "🔴",
      order_number: 9
    },
    levels: [
      {
        title: "Roles Config",
        file_name: "roles.json",
        description: "Виправ ролі користувачів.",
        difficulty: "expert",
        mode: "timed",
        correct_json: {
          roles: {
            admin: ["read", "write", "delete"],
            user: ["read"]
          }
        },
        broken_json: `{
  "roles": {
    admin: ["read", "write", "delete"],
    "user": ["read",]
  }
}`,
        hints: [
          "Ключ admin має бути в лапках.",
          "У масиві user зайва кома."
        ],
        explanation: "Помилки лапок у ключі та зайвої коми.",
        error_type: "quotes,comma",
        time_limit: 140,
        max_score: 280,
        stability_reward: 34
      },
      {
        title: "JWT Policy",
        file_name: "jwt-policy.json",
        description: "Виправ політику JWT.",
        difficulty: "expert",
        mode: "timed",
        correct_json: {
          jwt: {
            algorithm: "HS256",
            expiresIn: 3600,
            refreshAllowed: true
          }
        },
        broken_json: `{
  "jwt": {
    "algorithm": HS256,
    "expiresIn": "3600",
    "refreshAllowed": True
  }
}`,
        hints: [
          "HS256 має бути рядком.",
          "expiresIn має бути числом.",
          "True має бути true."
        ],
        explanation: "Помилки типів у JWT-конфігурації.",
        error_type: "string,type,boolean",
        time_limit: 140,
        max_score: 290,
        stability_reward: 33
      },
      {
        title: "Audit Log",
        file_name: "audit-log.json",
        description: "Виправ налаштування аудиту.",
        difficulty: "expert",
        mode: "classic",
        correct_json: {
          audit: {
            enabled: true,
            storeDays: 90,
            events: ["login", "logout", "permission_change"]
          }
        },
        broken_json: `{
  "audit": {
    "enabled": "true",
    "storeDays": "90",
    "events": ["login", "logout" "permission_change"]
  }
}`,
        hints: [
          "enabled має бути boolean.",
          "storeDays має бути числом.",
          "У масиві events пропущена кома."
        ],
        explanation: "Помилки типів та масиву.",
        error_type: "type,array",
        time_limit: 0,
        max_score: 280,
        stability_reward: 33
      }
    ]
  },
  {
    server: {
      title: "AI Analytics Server",
      description: "Аналітичний модуль не може обробити дані через пошкоджені JSON-схеми моделей і пайплайнів.",
      difficulty: "expert",
      category: "ai",
      reward_name: "AI Debug Master",
      reward_icon: "🔴",
      order_number: 10
    },
    levels: [
      {
        title: "Model Config",
        file_name: "model-config.json",
        description: "Виправ конфігурацію AI-моделі.",
        difficulty: "expert",
        mode: "timed",
        correct_json: {
          model: {
            name: "json-classifier",
            version: 2,
            active: true
          }
        },
        broken_json: `{
  "model": {
    "name": json-classifier,
    "version": "2",
    "active": True
  }
}`,
        hints: [
          "name має бути рядком.",
          "version має бути числом.",
          "True має бути true."
        ],
        explanation: "Помилки типів у конфігурації AI-моделі.",
        error_type: "string,type,boolean",
        time_limit: 150,
        max_score: 300,
        stability_reward: 34
      },
      {
        title: "Pipeline Config",
        file_name: "pipeline.json",
        description: "Виправ pipeline обробки даних.",
        difficulty: "expert",
        mode: "timed",
        correct_json: {
          pipeline: {
            steps: ["load", "clean", "predict"],
            batchSize: 32
          }
        },
        broken_json: `{
  "pipeline": {
    "steps": ["load", "clean" "predict"],
    "batchSize": "32",
  }
}`,
        hints: [
          "У масиві steps пропущена кома.",
          "batchSize має бути числом.",
          "В кінці зайва кома."
        ],
        explanation: "Помилки масиву, числа і зайвої коми.",
        error_type: "array,type,comma",
        time_limit: 150,
        max_score: 310,
        stability_reward: 33
      },
      {
        title: "Export Config",
        file_name: "export-config.json",
        description: "Виправ експорт аналітичних звітів.",
        difficulty: "expert",
        mode: "classic",
        correct_json: {
          export: {
            formats: ["json", "csv", "pdf"],
            compressed: false
          }
        },
        broken_json: `{
  "export": {
    "formats": ["json", "csv", "pdf",],
    "compressed": False
  }
}`,
        hints: [
          "У масиві formats зайва кома.",
          "False має бути false."
        ],
        explanation: "Помилки зайвої коми та boolean.",
        error_type: "comma,boolean",
        time_limit: 0,
        max_score: 300,
        stability_reward: 33
      }
    ]
  }
];

extraServers.forEach(item => {
  addServer(item.server, item.levels);
});

setTimeout(() => {
  console.log("Extra servers seeding finished");
  process.exit();
}, 2000);