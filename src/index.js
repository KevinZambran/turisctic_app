const express = require("express");
const session = require('express-session');
const path = require("path");
const pool = require("./psgsqldb");
const bodyParser = require('body-parser');
const tempelatePath = path.join(__dirname, '../templates');
const publicPath = path.join(__dirname, '../public');
const app = express();
const async = require("hbs/lib/async");
const port = process.env.PORT || 3000;

// Midellware
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(
  session({
    secret: 'mysecret',
    resave: false,
    saveUninitialized: true,
  })
);
app.use(express.static(publicPath))

//console.log(publicPath);
// Configuraciones de la app
app.set('view engine', 'hbs')
app.set('views', tempelatePath)


// Ruta de registro
app.get('/signup', (req, res) => {
  res.render('signup')
});

// Ruta de registro User admin
app.get('/registro', (req, res) => {
  res.render('registro')
});

// Ruta / el login
app.get('/', (req, res) => {
  if (req.session.loggedIn) {
    res.redirect('/home');
  } else {
    res.render('login')
  }
})

// Ruta home protegida
app.get('/home', (req, res) => {
  if (req.session.loggedIn) {
    try {
      const username = req.session.username;
      const id = req.session.userId;
      const rol = req.session.rol;
      res.render("home", { id: id, name: username, rol: rol });
    } catch (e) {
      console.log(e)
    }

  } else {
    // Si el usuario no ha iniciado sesión, redirige al inicio de sesión
    res.redirect('/');
  }
});

// Ruta View User protegida
app.get('/ViewUsuarios', async (req, res) => {
  if (req.session.loggedIn) {
    const username = req.session.username;
    const id = req.session.userId;
    const rol = 'usuario';
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT * FROM users WHERE rol = $1', [rol]);
      const users = result.rows;
      res.render("viewUser", { id: id, name: username, users });
      client.release();
    } catch (error) {
      console.error('Ocurrio un error en la consulta:', error);
      res.redirect('/home');
    }

  } else {
    // Si el usuario no ha iniciado sesión, redirige al inicio de sesión
    res.redirect('/');
  }
});

// Middleware para validar la sesión de inicio de sesión
const validarSesion = (req, res, next) => {
  // Verificar si el usuario ha iniciado sesión
  if (req.session.loggedIn) {
    // Si el usuario ha iniciado sesión, continúa con la solicitud
    next();
  } else {
    // Si el usuario no ha iniciado sesión, redirige al inicio de sesión
    res.redirect('/');
  }
};

// Ruta protegida que requiere inicio de sesión
app.get('/login', validarSesion, (req, res) => {
  // La sesión de inicio de sesión es válida, continúa con la lógica de la ruta protegida
  res.send('Bienvenido a la ruta protegida');
});

// LLenar campos de Update
app.get('/updateuser', async (req, res) => {
  const email = req.session.email;
  const username = req.session.username;
  const password = req.session.password;
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM users WHERE email = $1', [email]);
    const id = result.rows[0].id;
    res.render('updateuser', { id, username, email, password });
  } catch (error) {
    console.error('Ocurrio un error en la consulta: ', error);
    res.send('<script>alert("Error inesperado"); window.location.href = "/home";</script>');
  }

});

// Actualiza  cuenta
app.post('/usuarios/:id', async (req, res) => {
  try {
    const id = req.params.id;

    if (req.session.loggedIn) {
      /* console.log(req.session.rol) */
      if (req.session.rol == 'admin') {
        const { username, email, password1 } = req.body;
        const client = await pool.connect();
        const result = await client.query('SELECT * FROM users WHERE email = $1', [email]);

        if (result.rows.length > 0) {
          const result = await client.query(
            'UPDATE users SET username = $1, password = $2 WHERE id = $3',
            [username, password1, id]
          );

          // Verificar si se actualizó un registro exitosamente
          if (result.rowCount === 1) {
            res.redirect('/ViewUsuarios');
          } else {
            res.send('<script>alert("Registro no encontrado"); window.location.href = "/usuarios/${id}";</script>')
          }
          client.release();
        }
      } else {
        // Si el usuario no ha iniciado sesión, redirige al inicio de sesión
        res.redirect('/');
      }
    } else {
      const { username, email, password, password1 } = req.body;
      const client = await pool.connect();
      const result = await client.query('SELECT * FROM users WHERE email = $1', [email]);

      if (password == result.rows[0].password) {

        const result = await client.query(
          'UPDATE users SET username = $1, password = $2 WHERE id = $3',
          [username, password1, id]
        );
          req.session.username = username;
        // Verificar si se actualizó un registro exitosamente
        if (result.rowCount === 1) {
          res.redirect('/home');
        } else {
          res.send('<script>alert("Registro no encontrado"); window.location.href = "/usuarios/${id}";</script>')
        }
        client.release();
      }
    }
  } catch (error) {
    console.error('Error inesperado: ', error);
    res.send('<script>alert("Error inesperado"); window.location.href = "/home";</script>');
  }
});

// Actualizar cuentas usuario admin
app.post('/updateuseradmin', async (req, res) => {
  try {

    if (req.session.loggedIn) {
      const idd = req.body.id;
      const client = await pool.connect();
      const checkUser = await client.query('SELECT * FROM users WHERE id = $1', [idd]);
      if (checkUser.rows.length === 0) {
        res.send('<script>alert("Usuario no encontrado"); window.location.href = "/home";</script>');
        return;
      }
      
      const id = checkUser.rows[0].id;
      const username = checkUser.rows[0].username;
      const email = checkUser.rows[0].email;
      const password = checkUser.rows[0].password;
      const role = checkUser.rows[0].rol;
      res.render('updateuser', { id, username, email, password, role: role });
    } else {
      // Si el usuario no ha iniciado sesión, redirige al inicio de sesión
      res.redirect('/');
    }

  } catch (error) {
    console.error('Ocurrio un error en la consulta:', error);
    res.send('<script>alert("Error inesperado"); window.location.href = "/home";</script>');
  }
});

//Ruta protegida
app.get('/updateuser', validarSesion, (req, res) => {
  // La sesión de inicio de sesión es válida, continúa con la lógica de la ruta protegida
  res.send('Bienvenido a la ruta protegida');
});

// Registrar cuenta
app.post('/signup', async (req, res) => {
  try {
    const rol = 'usuario';
    if (req.session.loggedIn) {
      if (req.session.rol == 'admin') {
        const { username, email, password } = req.body;
        const client = await pool.connect();
        // Verificar si el usuario ya existe
        const checkUser = await client.query('SELECT * FROM users WHERE email = $1', [email]);
        if (checkUser.rows.length > 0) {
          // Usuario duplicado
          res.send('<script>alert("Ya hay una cuenta exsitente con ese correo"); window.location.href = "/signup";</script>');
        } else {
          // Insertar el nuevo usuario
          const result = await client.query('INSERT INTO users (username, email, rol, password) VALUES ($1, $2, $3, $4)  RETURNING *', [username, email, rol, password]);
          res.redirect('/ViewUsuarios');
        }
        client.release();
      }
    } else {
      const { username, email, password } = req.body;
      const client = await pool.connect();
      // Verificar si el usuario ya existe
      const checkUser = await client.query('SELECT * FROM users WHERE email = $1', [email]);
      if (checkUser.rows.length > 0) {
        // Usuario duplicado
        res.send('<script>alert("Ya hay una cuenta existente con ese correo"); window.location.href = "/signup";</script>');
      } else {
        // Insertar el nuevo usuario
        await client.query('INSERT INTO users (username, email, rol, password) VALUES ($1, $2, $3, $4)', [username, email, rol, password]);
        res.redirect('/');
      }
      client.release();
    }
  } catch (error) {
    console.error('Error inesperado:', error);
    res.send('<script>alert("Error inesperado"); window.location.href = "/home";</script>');
  }
});

// Iniciar sesion cuenta
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length > 0) {
      const pass = result.rows[0].password;
      const rol = result.rows[0].rol;
      const username = result.rows[0].username;
      const id = result.rows[0].id;
      if (password == pass) {
        req.session.loggedIn = true
        req.session.userId = id;
        req.session.username = username;
        req.session.email = email;
        req.session.rol = rol;
        req.session.password = pass;
        if (rol == 'admin') {
          res.status(201).render("home", { id: id, name: username, rol: rol });
        } else {
          res.status(201).render("home", { id: id, name: username });
        }
      } else {
        res.send('<script>alert("Credenciales inválidas"); window.location.href = "/login";</script>');
      }
    } else {
      // Usuario inválido
      res.send('<script>alert("Usuario no existe"); window.location.href = "/login";</script>');
    }
    client.release();
  } catch (error) {
    console.error('Ocurrio un error en la consulta:', error);
    res.send('<script>alert("Error inesperado"); window.location.href = "/home";</script>');
  }
});

// Eliminar cuenta por id 
app.post('/delete', async (req, res) => {
  try {
    if (req.session.loggedIn) {
      if (req.session.rol == 'admin') {
        const id = req.body.id;
        const client = await pool.connect();
        const checkUser = await client.query('SELECT * FROM users WHERE id = $1', [id]);
        if (checkUser.rows.length === 0) {
          res.send('<script>alert("Usuario no existente"); window.location.href = "/";</script>');
          return;
        }
        // Eliminar el usuario
        await client.query('DELETE FROM users WHERE id = $1', [id]);
        client.release();
        // Redirigir a la página de inicio de sesión
        res.send('<script>alert("Usuario eliminado correctamente"); window.location.href = "/home";</script>');
      } else {
        const id = req.body.id;
        const client = await pool.connect();
        const rol = req.session.rol;
        /* console.log('el rol es');
        console.log(rol);
        console.log('fin de rol'); */
        const checkUser = await client.query('SELECT * FROM users WHERE id = $1 AND rol = $2', [id, rol]);
        if (checkUser.rows.length === 0) {
          res.send('<script>alert("Usuario no encontrado"); window.location.href = "/home";</script>');
          return;
        }
        // Eliminar el usuario
        await client.query('DELETE FROM users WHERE id = $1', [id]);
        client.release();
        // Destruir la sesión de inicio de sesión
        req.session.destroy();
        res.send('<script>alert("Usuario eliminado correctamente"); window.location.href = "/";</script>');
      }
    } else {
      res.send('<script>alert("No tienes roles"); window.location.href = "/";</script>');
    }
  } catch (error) {
    console.error('Ocurrio un error en la consulta:', error);
    res.send('<script>alert("Error inesperado"); window.location.href = "/home";</script>');
  }
});

// Cerrar sesion cuenta
app.get('/logout', (req, res) => {
  // Destruir la sesión de inicio de sesión
  req.session.destroy();

  // Redirigir a la página de inicio de sesión
  res.redirect('/');
});

// Iniciar el servidor
app.listen(3000, () => {
  console.log('Se inicio el servidor en el puerto 3000');
});