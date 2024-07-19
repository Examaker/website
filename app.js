import * as dotenv from "dotenv";
import OpenAI from "openai";
import express from 'express';
import bcrypt from "bcrypt";
import { generateToken } from './utils/jwt.js';
import bodyParser from 'body-parser';
import authMiddleware from './middleware/auth.js';
import cookieParser from 'cookie-parser';





dotenv.config();

import connectToDatabase from './config/db.js';
import User from './models/user.js';
const app = express();
const port = 3000; 

connectToDatabase()



app.set('view engine', 'ejs');

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

app.get('/check', authMiddleware, (req, res) => {
  res.json({ authenticated: req.isAuthenticated });
});

let finalExam = null;

app.get('/', (req, res) => {
  res.render("accueil",);
});

// sign up page 

app.post('/signup', async (req, res) => {
  try {
      const { username, lastname, email, password , } = req.body;
      const signerrors = [];
      
      
      
        // Check if the user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          signerrors.push("L'adresse e-mail existe déjà, essayez d'en utiliser une autre ou connectez-vous. ");
        }
    
        // If there are any errors, render the signup page with the errors
        if (signerrors.length > 0) {
            return res.render('signup', { signerrors });
        }
    
      // Hash and encrypt the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create a new user
      const newUser = new User({ username, lastname, email, password: hashedPassword });
      await newUser.save();

    res.redirect('login');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error creating user');
  }
});

app.get('/signup', (req, res) => {
  res.render('signup', { signerrors: [] });
});

// login page 

const secret = 'EXAMAKER LTD SECRET CODE KM'; 


app.post('/login', async (req, res) => {
  try {
    const errors = [];
    const { email, password } = req.body;

    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      errors.push("Email non trouvé.");
    } else {
      // Verify the password
      const isPasswordMatch = await bcrypt.compare(password, user.password);
      if (!isPasswordMatch) {
        errors.push("Mot de passe erroné.");
      }
    }

    // If there are any errors, render the login page with the errors
    if (errors.length > 0) {
      return res.render('login', { errors });
    }

    // Generate a JWT
    const token = generateToken(user);

    // Set the JWT token as an HTTP-only cookie
    res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'Strict' });
    res.redirect('/');
  } catch (error) {
    console.error("Erreur de connexion:", error);
    // Render the login page with a server error message
    return res.render('login', { errors: ["Erreur du serveur."] });
  }
});

app.get('/logout', (req,res)=> {
  res.cookie('token' ,'' , { maxAge : 1}) ;
  res.redirect('/')
});

app.get('/login', (req, res) => {
  return res.render('login', { errors: [] });
});




app.get('/exammain', authMiddleware, (req, res) => {
  res.render("exammain", { fileReady: !!finalExam, processing: false, isAuthenticated: req.isAuthenticated });
});



app.get('/Tutoriels', (req, res) => {
  res.render("tutoriels", );
});

app.get('/Contact', (req, res) => {
  res.render("contact", );
});

app.get('/Apropos', (req, res) => {
  res.render("Apropos", );
});

app.get('/payment', (req, res) => {
  res.render("payment", );
});




const assistantId = process.env.OPENAI_ASSISTANT_ID;
const openai = new OpenAI({
    apikey: process.env.OPENAI_API_KEY,
});



app.post('/', async (req, res) => {
  const { niveauScolaire, discipline, moduleApprentissage } = req.body;

 

  const sentence = `Je veux un examain de ${discipline} pour les élèves de ${niveauScolaire}, ${moduleApprentissage}
 ,  en document word.`;
 
  try {
    // 1. Retrieve the assistant
    const Assistant = await openai.beta.assistants.retrieve(assistantId);
    console.log(Assistant);


    // 2. Create a new thread
    const thread = await openai.beta.threads.create();
    const threadId = thread.id;
    console.log(`New thread created with ID: ${threadId}`);

    // 3. Send a message in the thread 
    const message = await openai.beta.threads.messages.create(threadId, {
      role: 'user',
      content: sentence
    });
    const messageId = message.id ;
    console.log(messageId);


    // 4. Create a run
    const runResponse = await openai.beta.threads.runs.create(
        threadId , {
      assistant_id: assistantId
    });
    const runId = runResponse.id;

    // 5. Check run status and retrieve messages
    let runStatus;
    do {
      const runStatusResponse = await openai.beta.threads.runs.retrieve(threadId, runId);
      runStatus = runStatusResponse.status;
      console.log(`Run status: ${runStatus}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    } while (runStatus !== 'completed');

    // 6. Retrieve messages
    const messagesResponse = await openai.beta.threads.messages.list(threadId);
    const reply = messagesResponse.data[0].content[0].text.value;
    console.log(messagesResponse)

    // 7. Retrieve file content 
    const fileId = await messagesResponse.data[0].content[0].text.annotations[0].file_path.file_id
    const response = await openai.files.content(fileId);
    const fileData = await response.arrayBuffer();
    const file_data_buffer = Buffer.from(fileData);
    finalExam = file_data_buffer;
    console.log(`the fileId is ${fileId}`)

    //  send it to the front
    res.render("exammain", { fileReady: !!finalExam, });
  

  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
});
app.get('/download', (req, res) => {
  if (finalExam) {
    res.setHeader('Content-Disposition', 'attachment; filename="Examen.docx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.send(finalExam);
  } else {
    res.status(404).send('File not found.');
  }
});


app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});