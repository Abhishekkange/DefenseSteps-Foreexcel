const express = require('express');
const connectToMongoose = require('./apis/v1/db/db');
const app = express();


connectToMongoose();

app.use(express.json());
app.use("/api/v1", require('./apis/v1/routers/auth'));
app.use("/api/v1", require('./apis/v1/routers/users'));




app.listen(3000, () => {
  console.log('Server is running on port 3000');
});