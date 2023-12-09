const express = require('express');
const app = express();
const cors = require('cors')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const {decode} = require('jsonwebtoken')
const { MongoClient, ServerApiVersion, ObjectId} = require('mongodb');
require('dotenv').config()

const port = process.env.PORT ||3000;

app.use(cors());
app.use(express.json());
app.use(cookieParser());


const uri = `mongodb+srv://${process.env.User_DB}:${process.env.User_pass}@cluster0.cefd8nv.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});


const logger = async (req, res, next) => {
    next();
}

const verifyToken = async (req, res, next) => {
    const token = req.cookies?.token;
    if (!token) {
        return res.status(401).send({message: 'unauthorized'})
    }
    jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
        if (err) {
            console.log(err)
            return res.status(401).send({message: 'unauthorized'})
        }
        req.user = decoded;
        next();
    })

}

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

        
        app.get('/', (req, res) => {
            res.send('Server Started')
        })
        


        app.post('/jwt', logger, async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN, {expiresIn: '1h'});

            res.cookie('token', token, {
                httpOnly: true,
                // secure: false,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            }).send({success: true})
        })

        app.post('/logout', async (req, res) => {
            const user = req.body;
            console.log('logging out', user)
            res.clearCookie('token', {maxAge: 0}).send({success: true})
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

        app.post('/homeassignments', async (req, res) => {
            const assignment = req.body;
            const result = await AssignmentsCollection.insertOne(assignment);
            res.send(result);
        })

        app.put('/homeassignments/:id', async (req, res) => {
            const id = req.params.id;
            const filter = {_id: new ObjectId(id)}
            const updateAssignment = req.body;
            const assignment = {
                $set: {

                    userMarks: updateAssignment.userMarks,

                }
            }
            const result = await AssignmentsCollection.updateOne(filter, assignment);
            res.send(result);
        })

        app.patch('/homeassignments/:id', async (req, res) => {
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

        app.delete('/homeassignments/:id', async (req, res) => {
            const id = req.params.id;
            const query = {_id: new ObjectId(id)}
            const result = await AssignmentsCollection.deleteOne(query);
            res.send(result);
        })




        app.get('/assignments', logger, verifyToken, async (req, res) => {

            const page =parseInt(req.query.page);
            const size = parseInt(req.query.size);

            if(req.user.email !== req.query.email){
                return res.status(403).send({message: 'forbidden access'})
            }

            let query = {};
            if(req.query?.email){
                query = {email: req.query.email}
            }

            const assignment = AssignmentsCollection.find(query).skip(page * size).limit(size)
            const result = await assignment.toArray();
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
                    thumbnail: updateAssignment.thumbnail,
                    description: updateAssignment.description,
                    email: updateAssignment.email,
                    userMarks: updateAssignment.userMarks,
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




app.listen(port, () => [
    console.log(`Server Started, ${port}`)
])
