const express = require("express")
const path = require("path")
const session = require('express-session');
const app = express()
// const hbs = require("hbs")
const LogInCollection = require("./mongodb");
const async = require("hbs/lib/async");
const port = process.env.PORT || 3000
app.use(express.json())

app.use(express.urlencoded({ extended: false }))

const tempelatePath = path.join(__dirname, '../templates')
const publicPath = path.join(__dirname, '../public')
console.log(publicPath);

app.set('view engine', 'hbs')
app.set('views', tempelatePath)
app.use(
  session({
    secret: 'mysecret',
    resave: false,
    saveUninitialized: true,
  })
);
app.use(express.static(publicPath))


app.get('/signup', (req, res) => {
    res.render('signup')
})

app.get('/updateuser',async (req, res) => {
  const email = req.session.email;
  const password = req.session.password;
  const user = await LogInCollection.findOne({ email });
  const obj = user._id
  const id = obj.toString();
  res.render('updateuser', { id,email, password });

})

app.get('/', (req, res) => {
    res.render('login')
})
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


app.get('/updateuser', validarSesion, (req, res) => {
  // La sesión de inicio de sesión es válida, continúa con la lógica de la ruta protegida
  res.send('Bienvenido a la ruta protegida');
});

app.post('/signup', async (req, res) => {
    try {
        const { email, password } = req.body;
        const data = {
            email: req.body.email,
            password: req.body.password
        }

        // Verificar si el email ya existe en la colección
        const existingUser = await LogInCollection.findOne({ email });

        if (existingUser) {
            return res.status(400).send('El email ya está registrado');
        }

        // Crea un nuevo documento o instancia de modelo con los datos
        const user = new LogInCollection(data);

        // Guarda el nuevo documento en la colección
        await user.save()
        .then((data) => res.json(data))
        .catch((error) => res.json({message: error}));

        // Establecer una sesión de inicio de sesión
        req.session.loggedIn = true;
        req.session.email = email;
        req.session.password = password;

        res.status(201).render("home", {
          naming: req.body.email
        })
    } catch (error) {
        res.status(500).send('Error al guardar los datos');
    }
});
const ObjectId = require('mongodb').ObjectId;

app.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;
        const check = await LogInCollection.findOne({ email: req.body.email })

        if (check && check.password === req.body.password) {
          const user = await LogInCollection.findOne({ email });
          // Establecer una sesión de inicio de sesión
          req.session.loggedIn = true
          const obj = user._id
          const id = obj.toString()
          req.session.userId = obj.toString();
          req.session.email = email
          req.session.password = password
          res.status(201).render("home", { id: id});
        } else {
            res.status(401).send('Credenciales inválidas');
        }
    } catch (e) {
        // Error al iniciar sesión
        res.status(500).send('Error al iniciar sesión' + e);
    }
});


app.get('/logout', (req, res) => {
  // Destruir la sesión de inicio de sesión
  req.session.destroy();

  // Redirigir a la página de inicio de sesión
  res.redirect('/');
});

app.post('/usuarios/:id', async (req, res) => {
  try {
    const id = req.params.id;
    console.log(id)
    const { email, password, password1 } = req.body;
    const updateData = {
      email: req.body.email,
      password: req.body.password1
    }

    const check = await LogInCollection.findOne({ email: req.body.email });

    if (check && check.password === req.body.password) {
      const updatedUser = await LogInCollection.findByIdAndUpdate(id, updateData, { new: true });

      res.status(201).render("home");
    }    

  } catch (error) {
    res.status(500).send('Error al actualizar los datos' + error);
  }
});

app.get('/delete/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const deletedUser = await LogInCollection.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).send('Usuario no encontrado');
    }

    res.status(200).send('Usuario eliminado correctamente');
  } catch (error) {
    res.status(500).send('Error al eliminar el usuario');
  }
});

// Iniciar el servidor
app.listen(3000, () => {
  console.log('Servidor iniciado en el puerto 3000');
});