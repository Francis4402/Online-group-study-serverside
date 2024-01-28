const express = require('express');
const app = express();
const cors = require('cors')
const jwt = require('jsonwebtoken')
const {decode} = require('jsonwebtoken')
const { MongoClient, ServerApiVersion, ObjectId} = require('mongodb');
require('dotenv').config()

const port = process.env.PORT ||3000;

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.User_DB}:${process.env.User_pass}@cluster0.noqamg3.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});






const dbConnect = async () => {
    try{
      client.connect()
      console.log('DB Connected Successfully')
    } catch (error){
      console.log(error.name, error.message)
    }
  }
  dbConnect()



        const AssignmentsCollection = client.db('OGS').collection('UserAssignments')
        const UserMarksCollection = client.db('OGS').collection('userMarks')
        
        app.get('/', (req, res) => {
            res.send('Server Started')
        })


        const logger = async (req, res, next) => {
            next();
        }

        app.post('/jwt', logger, async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN, {expiresIn: '1h'});
            res.send({token});
        })

        const verifyToken = async (req, res, next) => {
            if(!req.headers.authorization){
                return res.status(401).send({message: 'forbidden access'});
            }
            const token = req.headers.authorization.split(' ')[1];
            jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
                if(err){
                    return res.status(401).send({message: 'forbidden access'})
                }
                req.decoded = decoded;
                next();
            })
        }

        app.post('/logout', async (req, res) => {
            const user = req.body;
            console.log('logging out', user)
            res.clearCookie('token', {maxAge: 0}).send({success: true})
        })

        app.get('/totalmarks', async (req, res) => {
            const result = await UserMarksCollection.find().toArray();
            res.send(result);
        })

        app.get('/usermarks', async (req, res) => {
            const email = req.query.email;
            const query = {email: email}
            const result = await UserMarksCollection.find(query).toArray();
            res.send(result);
        })

        app.post('/usermarks', async (req, res) => {
            const user = req.body;
            const query = {email: user.email}
            const existingUser = await UserMarksCollection.findOne(query);
            if(existingUser){
                return res.send({message: 'Your Mark already exists', insertedId: null})
            }
            const result = await UserMarksCollection.insertOne(user);
            res.send(result);
        })

        app.get('/homeassignments', async (req, res) => {

            const page = parseInt(req.query.page);
            const size = parseInt(req.query.size);
            
            const assignment = AssignmentsCollection.find().skip(page * size).limit(size)
            const result = await assignment.toArray();
            res.send(result);
        })

        app.get('/homeassignments/:id', async (req, res) => {
            const id = req.params.id;
            const query = {_id: new ObjectId(id)}
            const result = await AssignmentsCollection.findOne(query)
            res.send(result);
        })
        
        app.get('/homeassignmentscount', async (req, res) => {
            const count = await AssignmentsCollection.estimatedDocumentCount();
            res.send({count})
        })


        app.delete('/homeassignments/:id', async (req, res) => {
            const id = req.params.id;
            const query = {_id: new ObjectId(id)}
            const result = await AssignmentsCollection.deleteOne(query);
            res.send(result);
        })

        app.get('/assignments', async (req, res) => {
            const email = req.query.email;
            const query = {email: email}
            const result = await AssignmentsCollection.find(query).toArray();
            res.send(result);
        })

        app.get('/assignmentscount', async (req, res) => {
            const count = await AssignmentsCollection.estimatedDocumentCount();
            res.send({count})
        })


        app.get('/assignments/:id', async (req, res) => {
            const id = req.params.id;
            const query = {_id: new ObjectId(id)}
            const result = await AssignmentsCollection.findOne(query)
            res.send(result);
        })

        app.post('/assignments', async (req, res) => {
            const assignment = req.body;
            const result = await AssignmentsCollection.insertOne(assignment);
            res.send(result);
        })

        app.put('/assignments/:id', async (req, res) => {
            const id = req.params.id;
            const filter = {_id: new ObjectId(id)}
            const options = {upsert: true};
            const updateAssignment = req.body;
            const assignment = {
                $set: {
                    title: updateAssignment.title,
                    image: updateAssignment.image,
                    description: updateAssignment.description,
                    email: updateAssignment.email,
                    marks: updateAssignment.marks,
                    date: updateAssignment.date,
                    level: updateAssignment.level
                }
            }
            const result = await AssignmentsCollection.updateOne(filter, assignment, options);
            res.send(result);
        })

        app.patch('/assignments/:id', async (req, res) => {
            const id = req.params.id;
            const filter = {_id: new ObjectId(id)}
            const UpdatedAssignment = req.body;

            const updateDoc = {
                $set: {
                    status: UpdatedAssignment.status
                }
            }
            const result = await AssignmentsCollection.updateOne(filter, updateDoc)
            res.send(result)
        })

        app.delete('/assignments/:id', async (req, res) => {
            const id = req.params.id;
            const query = {_id: new ObjectId(id)}
            const result = await AssignmentsCollection.deleteOne(query);
            res.send(result);
        })




app.listen(port, () => {
        console.log(`Server Started, ${port}`)
})
