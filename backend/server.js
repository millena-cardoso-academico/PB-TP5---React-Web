const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');


const app = express();
const PORT = process.env.PORT || 3001;

const corsOptions = {
    origin: 'http://localhost:5173', 
    optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());

const db = new sqlite3.Database(':memory:'); 

db.serialize(() => {
  db.run(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT
    )
  `);
});

db.serialize(() => {
  db.run(`
    CREATE TABLE watched_movies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      movie_id INTEGER,
      UNIQUE(user_id, movie_id),
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);
});

db.serialize(() => {
  db.run(`
    CREATE TABLE ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      movie_id INTEGER,
      rating INTEGER,
      UNIQUE(user_id, movie_id),
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);
});

db.serialize(() => {
  db.run(`
    CREATE TABLE plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE,
      price REAL,
      movie_limit INTEGER
    )
  `);
});

db.serialize(() => {
  db.run(`
    CREATE TABLE user_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      plan_id INTEGER,
      start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      end_date DATETIME,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(plan_id) REFERENCES plans(id)
    )
  `);
});

db.serialize(() => {
  db.run(`
    CREATE TABLE cart_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      movie_id INTEGER,
      title TEXT,
      showtime TEXT,
      date TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS purchased_movies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      movie_id INTEGER,
      purchase_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      title TEXT,
      showtime TEXT,
      date TEXT,
      UNIQUE(user_id, movie_id),
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);
});

db.serialize(() => {
  db.run(`
    CREATE TABLE favorite_movies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      movie_id INTEGER,
      UNIQUE(user_id, movie_id),
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);
});

app.post('/favorites', (req, res) => {
  const { username, movie_id } = req.body;

  if (!username || !movie_id) {
    return res.status(400).json({ error: 'Nome de usuário e ID do filme são obrigatórios.' });
  }

  db.get('SELECT id FROM users WHERE username = ?', [username], (err, user) => {
    if (err) {
      console.error('Erro ao buscar usuário:', err.message);
      return res.status(500).json({ error: 'Erro no servidor' });
    } 
    if (user) {
      const stmt = db.prepare('INSERT INTO favorite_movies (user_id, movie_id) VALUES (?, ?)');
      stmt.run(user.id, movie_id, function (err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Filme já está nos favoritos.' });
          } else {
            console.error('Erro ao inserir filme favorito:', err.message);
            return res.status(500).json({ error: 'Erro no servidor' });
          }
        } else {
          return res.status(200).json({ message: 'Filme adicionado aos favoritos com sucesso.' });
        }
      });
      stmt.finalize();
    } else {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }
  });
});

app.delete('/favorites', (req, res) => {
  const { username, movie_id } = req.body;

  if (!username || !movie_id) {
    return res.status(400).json({ error: 'Nome de usuário e ID do filme são obrigatórios.' });
  }

  db.get('SELECT id FROM users WHERE username = ?', [username], (err, user) => {
    if (err) {
      console.error('Erro ao buscar usuário:', err.message);
      return res.status(500).json({ error: 'Erro no servidor' });
    } 
    if (user) {
      db.run('DELETE FROM favorite_movies WHERE user_id = ? AND movie_id = ?', [user.id, movie_id], function (err) {
        if (err) {
          console.error('Erro ao remover filme favorito:', err.message);
          return res.status(500).json({ error: 'Erro no servidor' });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Filme não encontrado nos favoritos.' });
        }
        return res.status(200).json({ message: 'Filme removido dos favoritos com sucesso.' });
      });
    } else {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }
  });
});

app.get('/favorites/:username', (req, res) => {
  const { username } = req.params;

  db.get('SELECT id FROM users WHERE username = ?', [username], (err, user) => {
    if (err) {
      console.error('Erro ao buscar usuário:', err.message);
      return res.status(500).json({ error: 'Erro no servidor' });
    } 
    if (user) {
      db.all('SELECT movie_id FROM favorite_movies WHERE user_id = ?', [user.id], (err, rows) => {
        if (err) {
          console.error('Erro ao buscar filmes favoritos:', err.message);
          return res.status(500).json({ error: 'Erro no servidor' });
        } 
        const movieIds = rows.map(row => row.movie_id);
        return res.status(200).json({ favoriteMovies: movieIds });
      });
    } else {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }
  });
});

app.post('/watched', (req, res) => {
  const { username, movie_id } = req.body;

  db.get('SELECT id FROM users WHERE username = ?', [username], (err, user) => {
    if (err) {
      console.error('Erro ao buscar usuário:', err.message);
      res.status(500).json({ error: 'Erro no servidor' });
    } else if (user) {
      const stmt = db.prepare('INSERT INTO watched_movies (user_id, movie_id) VALUES (?, ?)');
      stmt.run(user.id, movie_id, function (err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            res.status(400).json({ error: 'Filme já marcado como visto' });
          } else {
            console.error('Erro ao inserir filme visto:', err.message);
            res.status(500).json({ error: 'Erro no servidor' });
          }
        } else {
          res.status(200).json({ message: 'Filme marcado como visto' });
        }
      });
      stmt.finalize();
    } else {
      res.status(404).json({ error: 'Usuário não encontrado' });
    }
  });
});

app.get('/limit_usage/:username', (req, res) => {
  const { username } = req.params;

  getUserId(username, (err, userId) => {
    if (err) {
      if (err.message === 'Usuário não encontrado') {
        return res.status(404).json({ error: err.message });
      }
      return res.status(500).json({ error: 'Erro no servidor' });
    }

    getActivePlan(userId, (err, userPlan) => {
      if (err) {
        if (err.message === 'Usuário não tem um plano ativo') {
          return res.status(400).json({ error: err.message });
        }
        return res.status(500).json({ error: 'Erro no servidor' });
      }

      const { movie_limit, start_date, end_date } = userPlan;

      getPurchasedCount(userId, start_date, end_date, (err, purchasedCount) => {
        if (err) {
          return res.status(500).json({ error: 'Erro no servidor' });
        }

        const remaining = movie_limit - purchasedCount;

        res.status(200).json({
          movie_limit,
          purchased: purchasedCount,
          remaining: remaining >= 0 ? remaining : 0
        });
      });
    });
  });
});

app.post('/cart', (req, res) => {
  const { username, movie_id, title, showtime, date } = req.body;

  if (!username || !movie_id || !title || !showtime || !date) {
    return res.status(400).json({ error: 'Dados incompletos para adicionar ao carrinho.' });
  }

  db.get('SELECT id FROM users WHERE username = ?', [username], (err, user) => {
    if (err) {
      console.error('Erro ao buscar usuário:', err.message);
      res.status(500).json({ error: 'Erro no servidor' });
    } else if (user) {
      const stmt = db.prepare('INSERT INTO cart_items (user_id, movie_id, title, showtime, date) VALUES (?, ?, ?, ?, ?)');
      stmt.run(user.id, movie_id, title, showtime, date, function (err) {
        if (err) {
          console.error('Erro ao adicionar ao carrinho:', err.message);
          res.status(500).json({ error: 'Erro ao adicionar ao carrinho' });
        } else {
          res.status(200).json({ message: 'Ingresso adicionado ao carrinho com sucesso!' });
        }
      });
      stmt.finalize();
    } else {
      res.status(404).json({ error: 'Usuário não encontrado' });
    }
  });
});

app.get('/cart/:username', (req, res) => {
  const { username } = req.params;

  db.get('SELECT id FROM users WHERE username = ?', [username], (err, user) => {
    if (err) {
      console.error('Erro ao buscar usuário:', err.message);
      res.status(500).json({ error: 'Erro no servidor' });
    } else if (user) {
      db.all(
        'SELECT cart_items.id, cart_items.movie_id, cart_items.title, cart_items.showtime, cart_items.date FROM cart_items WHERE cart_items.user_id = ?',
        [user.id],
        (err, rows) => {
          if (err) {
            console.error('Erro ao buscar carrinho:', err.message);
            res.status(500).json({ error: 'Erro no servidor' });
          } else {
            res.status(200).json({ cart: rows });
          }
        }
      );
    } else {
      res.status(404).json({ error: 'Usuário não encontrado' });
    }
  });
});

app.delete('/cart/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM cart_items WHERE id = ?', [id], function (err) {
    if (err) {
      console.error('Erro ao remover do carrinho:', err.message);
      res.status(500).json({ error: 'Erro ao remover do carrinho' });
    } else if (this.changes === 0) {
      res.status(404).json({ error: 'Ingresso não encontrado no carrinho' });
    } else {
      res.status(200).json({ message: 'Ingresso removido do carrinho com sucesso!' });
    }
  });
});

app.get('/watched/:username', (req, res) => {
  const { username } = req.params;
  console.log(`Recebido pedido de filmes assistidos para o usuário: ${username}`);

  db.get('SELECT id FROM users WHERE username = ?', [username], (err, user) => {
    if (err) {
      console.error('Erro ao buscar usuário:', err.message);
      res.status(500).json({ error: 'Erro no servidor' });
    } else if (user) {
      db.all('SELECT movie_id FROM watched_movies WHERE user_id = ?', [user.id], (err, rows) => {
        if (err) {
          console.error('Erro ao buscar filmes assistidos:', err.message);
          res.status(500).json({ error: 'Erro no servidor' });
        } else {
          const movieIds = rows.map(row => row.movie_id);
          console.log(`Usuário ${username} assistiu os filmes: `, movieIds);
          res.status(200).json({ watchedMovies: movieIds });
        }
      });
    } else {
      console.warn(`Usuário ${username} não encontrado.`);
      res.status(404).json({ error: 'Usuário não encontrado' });
    }
  });
});

db.serialize(() => {
  db.get('SELECT id FROM plans WHERE name = ?', ['Standard'], (err, row) => {
    if (err) {
      console.error('Erro ao buscar plano Standard:', err.message);
    } else if (!row) {
      const stmt = db.prepare('INSERT INTO plans (name, price, movie_limit) VALUES (?, ?, ?)');
      stmt.run('Standard', 9.99, 10, function (err) {
        if (err) {
          console.error('Erro ao inserir plano Standard:', err.message);
        } else {
          console.log('Plano "Standard" inserido.');
        }
      });
      stmt.finalize();
    } else {
      console.log('Plano "Standard" já existe.');
    }
  });

  db.get('SELECT id FROM plans WHERE name = ?', ['Premium'], (err, row) => {
    if (err) {
      console.error('Erro ao buscar plano Premium:', err.message);
    } else if (!row) {
      const stmt = db.prepare('INSERT INTO plans (name, price, movie_limit) VALUES (?, ?, ?)');
      stmt.run('Premium', 19.99, 20, function (err) {
        if (err) {
          console.error('Erro ao inserir plano Premium:', err.message);
        } else {
          console.log('Plano "Premium" inserido.');
        }
      });
      stmt.finalize();
    } else {
      console.log('Plano "Premium" já existe.');
    }
  });
});


app.get('/plans', (req, res) => {
  db.all('SELECT id, name, price, movie_limit FROM plans', [], (err, rows) => {
    if (err) {
      console.error('Erro ao buscar planos:', err.message);
      res.status(500).json({ error: 'Erro no servidor' });
    } else {
      res.status(200).json({ plans: rows });
    }
  });
});

function formatDate(date) {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

app.post('/subscribe', (req, res) => {
  const { username, plan_id } = req.body;

  db.get('SELECT id FROM users WHERE username = ?', [username], (err, user) => {
    if (err) {
      console.error('Erro ao buscar usuário:', err.message);
      res.status(500).json({ error: 'Erro no servidor' });
    } else if (user) {
      db.get('SELECT id, name FROM plans WHERE id = ?', [plan_id], (err, plan) => {
        if (err) {
          console.error('Erro ao buscar plano:', err.message);
          res.status(500).json({ error: 'Erro no servidor' });
        } else if (plan) {
          const currentDate = new Date();
          const oneMonthLater = new Date(currentDate);
          oneMonthLater.setMonth(currentDate.getMonth() + 1);

          const formattedStartDate = formatDate(currentDate);
          const formattedEndDate = formatDate(oneMonthLater);

          db.run(
            'INSERT INTO user_plans (user_id, plan_id, start_date, end_date) VALUES (?, ?, ?, ?)',
            [user.id, plan_id, formattedStartDate, formattedEndDate],
            function (err) {
              if (err) {
                console.error('Erro ao assinar plano:', err.message);
                res.status(500).json({ error: 'Erro no servidor' });
              } else {
                res.status(200).json({ message: `Plano "${plan.name}" assinado com sucesso.` });
              }
            }
          );
        } else {
          res.status(404).json({ error: 'Plano não encontrado' });
        }
      });
    } else {
      res.status(404).json({ error: 'Usuário não encontrado' });
    }
  });
});

app.get('/user_plan/:username', (req, res) => {
  const { username } = req.params;
  const currentDate = new Date().toISOString();

  db.get(
    `SELECT 
       plans.id, 
       plans.name, 
       plans.price, 
       plans.movie_limit,
       user_plans.end_date
     FROM user_plans 
     JOIN plans ON user_plans.plan_id = plans.id 
     WHERE user_plans.user_id = (
       SELECT id FROM users WHERE username = ?
     )
       AND user_plans.start_date <= ?
       AND user_plans.end_date >= ?
     ORDER BY user_plans.end_date DESC 
     LIMIT 1`,
    [username, currentDate, currentDate],
    (err, plan) => {
      if (err) {
        console.error('Erro ao buscar plano do usuário:', err.message);
        res.status(500).json({ error: 'Erro no servidor' });
      } else if (plan) {
        res.status(200).json({ plan });
      } else {
        res.status(200).json({ plan: null });
      }
    }
  );
});


app.get('/user/:username', (req, res) => {
  const { username } = req.params;

  db.get('SELECT id, username FROM users WHERE username = ?', [username], (err, user) => {
    if (err) {
      console.error('Erro ao buscar usuário:', err.message);
      res.status(500).json({ error: 'Erro no servidor' });
    } else if (user) {
      res.status(200).json({ id: user.id, username: user.username });
    } else {
      res.status(404).json({ error: 'Usuário não encontrado' });
    }
  });
});

app.post('/ratings', (req, res) => {
  const { username, movie_id, rating } = req.body;

  if (rating < 1 || rating > 5) {
    res.status(400).json({ error: 'A avaliação deve ser um número entre 1 e 5' });
    return;
  }

  db.get('SELECT id FROM users WHERE username = ?', [username], (err, user) => {
    if (err) {
      console.error('Erro ao buscar usuário:', err.message);
      res.status(500).json({ error: 'Erro no servidor' });
    } else if (user) {
      const stmt = db.prepare('INSERT INTO ratings (user_id, movie_id, rating) VALUES (?, ?, ?)');
      stmt.run(user.id, movie_id, rating, function (err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            // Atualizar a avaliação existente
            const updateStmt = db.prepare('UPDATE ratings SET rating = ? WHERE user_id = ? AND movie_id = ?');
            updateStmt.run(rating, user.id, movie_id, function (err) {
              if (err) {
                console.error('Erro ao atualizar avaliação:', err.message);
                res.status(500).json({ error: 'Erro no servidor' });
              } else {
                res.status(200).json({ message: 'Avaliação atualizada com sucesso' });
              }
            });
            updateStmt.finalize();
          } else {
            console.error('Erro ao inserir avaliação:', err.message);
            res.status(500).json({ error: 'Erro no servidor' });
          }
        } else {
          res.status(200).json({ message: 'Avaliação registrada com sucesso' });
        }
      });
      stmt.finalize();
    } else {
      res.status(404).json({ error: 'Usuário não encontrado' });
    }
  });
});

app.get('/ratings/:username/:movie_id', (req, res) => {
  const { username, movie_id } = req.params;

  db.get('SELECT id FROM users WHERE username = ?', [username], (err, user) => {
    if (err) {
      console.error('Erro ao buscar usuário:', err.message);
      res.status(500).json({ error: 'Erro no servidor' });
    } else if (user) {
      db.get('SELECT rating FROM ratings WHERE user_id = ? AND movie_id = ?', [user.id, movie_id], (err, row) => {
        if (err) {
          console.error('Erro ao buscar avaliação:', err.message);
          res.status(500).json({ error: 'Erro no servidor' });
        } else if (row) {
          res.status(200).json({ rating: row.rating });
        } else {
          res.status(200).json({ rating: null });
        }
      });
    } else {
      res.status(404).json({ error: 'Usuário não encontrado' });
    }
  });
});

function getUserId(username, callback) {
  db.get('SELECT id FROM users WHERE username = ?', [username], (err, user) => {
    if (err) {
      console.error('Erro ao buscar usuário:', err.message);
      return callback(err, null);
    }
    if (!user) {
      console.warn(`Usuário "${username}" não encontrado.`);
      return callback(new Error('Usuário não encontrado'), null);
    }
    return callback(null, user.id);
  });
}

function getActivePlan(userId, callback) {
  db.get(
    `SELECT 
       user_plans.id as user_plan_id, 
       plans.movie_limit, 
       user_plans.start_date, 
       user_plans.end_date
     FROM user_plans 
     JOIN plans ON user_plans.plan_id = plans.id 
     WHERE user_plans.user_id = ? 
       AND user_plans.start_date <= datetime('now') 
       AND user_plans.end_date >= datetime('now') 
     ORDER BY user_plans.end_date DESC 
     LIMIT 1`,
    [userId],
    (err, userPlan) => {
      if (err) {
        console.error('Erro ao buscar plano do usuário:', err.message);
        return callback(err, null);
      }
      if (!userPlan) {
        console.warn('Usuário não tem um plano ativo.');
        return callback(new Error('Usuário não tem um plano ativo'), null);
      }
      return callback(null, userPlan);
    }
  );
}

function getPurchasedCount(userId, startDate, endDate, callback) {
  db.get(
    `SELECT COUNT(*) as count 
     FROM purchased_movies 
     WHERE user_id = ? 
       AND datetime(purchase_date) >= datetime(?) 
       AND datetime(purchase_date) <= datetime(?)`,
    [userId, startDate, endDate],
    (err, countResult) => {
      if (err) {
        console.error('Erro ao contar filmes comprados:', err.message);
        return callback(err, null);
      }
      const purchasedCount = countResult.count || 0;
      return callback(null, purchasedCount);
    }
  );
}

function getCartCount(userId, callback) {
  db.get(
    `SELECT COUNT(*) as count 
     FROM cart_items 
     WHERE user_id = ?`,
    [userId],
    (err, cartResult) => {
      if (err) {
        console.error('Erro ao contar itens do carrinho:', err.message);
        return callback(err, null);
      }
      const cartCount = cartResult.count || 0;
      return callback(null, cartCount);
    }
  );
}

function getCartItems(userId, callback) {
  db.all(
    `SELECT movie_id, title, showtime, date
     FROM cart_items 
     WHERE user_id = ?`,
    [userId],
    (err, items) => {
      if (err) {
        console.error('Erro ao buscar itens do carrinho:', err.message);
        return callback(err, null);
      }
      return callback(null, items);
    }
  );
}

function insertPurchasedMovies(userId, items, callback) {
  const insertStmt = db.prepare(`
    INSERT INTO purchased_movies (user_id, movie_id, title, showtime, date) 
    VALUES (?, ?, ?, ?, ?)
  `);

  let inserted = 0;
  let hasErrorOccurred = false;

  items.forEach(item => {
    insertStmt.run(
      userId,
      item.movie_id,
      item.title,
      item.showtime,
      item.date,
      (err) => {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            console.warn(`Filme ID ${item.movie_id} já foi comprado por este usuário.`);
          } else {
            console.error(`Erro ao inserir movie_id ${item.movie_id}:`, err.message);
            hasErrorOccurred = true;
            insertStmt.finalize(() => {
              callback(err);
            });
            return;
          }
        }
        inserted++;
        if (inserted === items.length && !hasErrorOccurred) {
          insertStmt.finalize(() => {
            callback(null);
          });
        }
      }
    );
  });
}

function clearCart(userId, callback) {
  db.run(
    `DELETE FROM cart_items 
     WHERE user_id = ?`,
    [userId],
    function (err) {
      if (err) {
        console.error('Erro ao limpar carrinho:', err.message);
        return callback(err);
      }
      return callback(null);
    }
  );
}

app.post('/purchase', (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: 'Nome de usuário é obrigatório.' });
  }

  getUserId(username, (err, userId) => {
    if (err) {
      if (err.message === 'Usuário não encontrado') {
        return res.status(404).json({ error: err.message });
      }
      return res.status(500).json({ error: 'Erro no servidor' });
    }

    getActivePlan(userId, (err, userPlan) => {
      if (err) {
        if (err.message === 'Usuário não tem um plano ativo') {
          return res.status(400).json({ error: err.message });
        }
        return res.status(500).json({ error: 'Erro no servidor' });
      }

      const { movie_limit, start_date, end_date } = userPlan;

      getPurchasedCount(userId, start_date, end_date, (err, purchasedCount) => {
        if (err) {
          return res.status(500).json({ error: 'Erro no servidor' });
        }

        console.log('Filmes já comprados:', purchasedCount);

        getCartCount(userId, (err, cartCount) => {
          if (err) {
            return res.status(500).json({ error: 'Erro no servidor' });
          }

          console.log('Itens no carrinho:', cartCount);

          if ((purchasedCount + cartCount) > movie_limit) {
            return res.status(400).json({ error: 'Compra excede o limite do seu plano.' });
          }

          getCartItems(userId, (err, items) => {
            if (err) {
              return res.status(500).json({ error: 'Erro no servidor' });
            }

            if (items.length === 0) {
              console.warn('Carrinho vazio durante a compra.');
              return res.status(400).json({ error: 'Carrinho está vazio.' });
            }

            console.log('Itens a serem comprados:', items);

            db.run('BEGIN TRANSACTION', (err) => {
              if (err) {
                console.error('Erro ao iniciar transação:', err.message);
                return res.status(500).json({ error: 'Erro no servidor' });
              }

              insertPurchasedMovies(userId, items, (err) => {
                if (err) {
                  console.error('Erro ao inserir filmes comprados:', err.message);
                  db.run('ROLLBACK', (rollbackErr) => {
                    if (rollbackErr) {
                      console.error('Erro ao fazer rollback:', rollbackErr.message);
                    }
                    return res.status(500).json({ error: 'Erro ao processar a compra.' });
                  });
                } else {
                  clearCart(userId, (err) => {
                    if (err) {
                      console.error('Erro ao limpar carrinho:', err.message);
                      db.run('ROLLBACK', (rollbackErr) => {
                        if (rollbackErr) {
                          console.error('Erro ao fazer rollback:', rollbackErr.message);
                        }
                        return res.status(500).json({ error: 'Erro ao processar a compra.' });
                      });
                    } else {
                      db.run('COMMIT', (err) => {
                        if (err) {
                          console.error('Erro ao commitar transação:', err.message);
                          db.run('ROLLBACK', (rollbackErr) => {
                            if (rollbackErr) {
                              console.error('Erro ao fazer rollback:', rollbackErr.message);
                            }
                            return res.status(500).json({ error: 'Erro ao processar a compra.' });
                          });
                        } else {
                          console.log('Compra realizada com sucesso.');
                          return res.status(200).json({ message: 'Compra realizada com sucesso.' });
                        }
                      });
                    }
                  });
                }
              });
            });
          });
        });
      });
    });
  });
});

app.get('/purchased/:username', (req, res) => {
  const { username } = req.params;

  if (!username) {
    return res.status(400).json({ error: 'Nome de usuário é obrigatório.' });
  }

  getUserId(username, (err, userId) => {
    if (err) {
      if (err.message === 'Usuário não encontrado') {
        return res.status(404).json({ error: err.message });
      }
      return res.status(500).json({ error: 'Erro no servidor' });
    }

    db.all(
      `SELECT 
         movie_id,
         title,
         showtime,
         date,
         purchase_date
       FROM purchased_movies
       WHERE user_id = ?`,
      [userId],
      (err, rows) => {
        if (err) {
          console.error('Erro ao buscar sessões compradas:', err.message);
          return res.status(500).json({ error: 'Erro no servidor' });
        }

        return res.status(200).json({ purchasedMovies: rows });
      }
    );
  });
});

app.post('/register', (req, res) => {
  const { username, password } = req.body;
  const stmt = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
  stmt.run(username, password, function (err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        res.status(400).json({ error: 'Usuário já existe' });
      } else {
        console.error('Erro ao registrar usuário:', err.message);
        res.status(500).json({ error: 'Erro no servidor' });
      }
    } else {
      res.status(200).json({ message: 'Usuário registrado com sucesso' });
    }
  });
  stmt.finalize();
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.get('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, row) => {
    if (err) {
      console.error('Erro ao fazer login:', err.message);
      res.status(500).json({ error: 'Erro no servidor' });
    } else if (row) {
      res.status(200).json({ message: 'Login bem-sucedido' });
    } else {
      res.status(401).json({ error: 'Credenciais inválidas' });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

module.exports = { app, db };
