const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const {parse, isValid, format} = require('date-fns')
const path = require('path')
const app = express()
app.use(express.json())

let dbPath = path.join(__dirname, 'todoApplication.db')
let db = null

const instializedbAndServe = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })

    app.listen(3000, () => {
      console.log('server running at http://localhost:3000/')
    })
  } catch (e) {
    console.log('database error: ', e.message)
    process.exit(1)
  }
}

const checkInputs = async (req, res, next) => {
  let valus = req.query

  if (Object.keys(req.query).length === 0) {
    valus = req.body
  }
  let {status, priority, date, category, dueDate} = valus
  let statusArray = ['TO DO', 'IN PROGRESS', 'DONE']
  let priorityArray = ['HIGH', 'MEDIUM', 'LOW']
  let categoryArray = ['WORK', 'HOME', 'LEARNING']
  if (dueDate !== undefined && req.method === 'PUT') {
    const datePattern = /^\d{4}-\d{1,2}-\d{1,2}$/
    if (!datePattern.test(dueDate)) {
      console.log(req.method)
      res.status(400)
      res.send('Invalid Due Date')
    } else {
      next()
    }
  } else if (
    status === undefined &&
    priority === undefined &&
    category === undefined &&
    date === undefined
  ) {
    next()
  } else {
    if (
      category !== undefined &&
      status !== undefined &&
      priority !== undefined &&
      dueDate !== undefined
    ) {
      if (statusArray.includes(status)) {
        if (categoryArray.includes(category)) {
          if (priorityArray.includes(priority)) {
            const datePattern = /^\d{4}-\d{1,2}-\d{1,2}$/
            if (!datePattern.test(dueDate)) {
              res.status(400)
              res.send('Invalid Due Date')
            } else {
              next()
            }
          } else {
            res.status(400)
            res.send('Invalid Todo Priority')
          }
        } else {
          res.status(400)
          res.send('Invalid Todo Category')
        }
      } else {
        res.status(400)
        res.send('Invalid Todo Status')
      }
    } else if (
      category !== undefined &&
      status !== undefined &&
      priority !== undefined
    ) {
      if (statusArray.includes(status)) {
        if (categoryArray.includes(category)) {
          if (priorityArray.includes(priority)) {
            next()
          } else {
            res.status(400)
            res.send('Invalid Todo Priority')
          }
        } else {
          res.status(400)
          res.send('Invalid Todo Category')
        }
      } else {
        res.status(400)
        res.send('Invalid Todo Status')
      }
    } else if (category !== undefined && status !== undefined) {
      if (statusArray.includes(status)) {
        if (categoryArray.includes(category)) {
          next()
        } else {
          res.status(400)
          res.send('Invalid Todo Category')
        }
      } else {
        res.status(400)
        res.send('Invalid Todo Status')
      }
    } else if (status !== undefined && priority !== undefined) {
      if (statusArray.includes(status)) {
        if (priorityArray.includes(priority)) {
          next()
        } else {
          res.status(400)
          res.send('Invalid Todo Priority')
        }
      } else {
        res.status(400)
        res.send('Invalid Todo Status')
      }
    } else if (status !== undefined) {
      if (statusArray.includes(status)) {
        next()
      } else {
        res.status(400)
        res.send('Invalid Todo Status')
      }
    } else if (priority !== undefined) {
      if (priorityArray.includes(priority)) {
        next()
      } else {
        res.status(400)
        res.send('Invalid Todo Priority')
      }
    } else if (category !== undefined) {
      if (categoryArray.includes(category)) {
        next()
      } else {
        res.status(400)
        res.send('Invalid Todo Category')
      }
    } else if (date !== undefined) {
      const datePattern = /^\d{4}-\d{1,2}-\d{1,2}$/

      if (!datePattern.test(date)) {
        res.status(400)
        res.send('Invalid Due Date')
      } else {
        next()
      }
    }
  }
}
app.get('/todos', checkInputs, async (req, res) => {
  let {status, priority, search_q, category} = req.query
  let dbQuery =
    'SELECT id, todo, priority, status, category, due_date as dueDate FROM todo'

  if (search_q !== undefined) {
    dbQuery = `SELECT id, todo, priority, status, category, due_date as dueDate FROM todo WHERE todo LIKE '%${search_q}%'`
  }
  if (category !== undefined && status !== undefined) {
    dbQuery = `SELECT id, todo, priority, status, category, due_date as dueDate FROM todo WHERE status = '${status}' and category = '${category}'`
  } else if (category !== undefined && priority !== undefined) {
    dbQuery = `SELECT id, todo, priority, status, category, due_date as dueDate FROM todo WHERE priority = '${priority}' and category = '${category}'`
  } else if (category !== undefined) {
    dbQuery = `SELECT id, todo, priority, status, category, due_date as dueDate FROM todo WHERE category = '${category}'`
  }
  if (status !== undefined && priority !== undefined) {
    dbQuery = `SELECT id, todo, priority, status, category, due_date as dueDate FROM todo WHERE status = '${status}' and priority = '${priority}'`
  } else if (status !== undefined) {
    dbQuery = `SELECT id, todo, priority, status, category, due_date as dueDate FROM todo WHERE status = '${status}'`
  } else if (priority !== undefined) {
    dbQuery = `SELECT id, todo, priority, status, category, due_date as dueDate FROM todo WHERE priority = '${priority}'`
  }

  let todos = await db.all(dbQuery)
  res.send(todos)
})

app.get('/todos/:todoId/', async (req, res) => {
  let {todoId} = req.params
  let dbQuery = `SELECT id, todo, priority, status, category, due_date as dueDate FROM todo WHERE id = ${todoId}`

  let result = await db.get(dbQuery)
  res.send(result)
})

app.get('/agenda/', checkInputs, async (req, res) => {
  let {date} = req.query
  let dbQuery = `SELECT id, todo, priority, status, category, due_date as dueDate FROM todo WHERE strftime('%Y-%m-%d', due_date) = ?`

  let todos = await db.all(dbQuery, [date])
  res.send(todos)
})

app.post('/todos/', checkInputs, async (req, res) => {
  let {id, todo, priority, status, category, dueDate} = req.body
  let dbQuery = `INSERT INTO todo 
                  (id, todo, priority, status, category, due_date) VALUES 
                  (${id}, '${todo}', '${priority}', '${status}', '${category}', ${dueDate})`
  let result = await db.run(dbQuery)
  res.send('Todo Successfully Added')
})

app.put('/todos/:todoId/', checkInputs, async (req, res) => {
  let {todoId} = req.params
  let {status, priority, todo, category, dueDate} = req.body

  if (status !== undefined) {
    let dbQuery = `UPDATE todo SET status = '${status}' WHERE id = ${todoId}`
    let result = await db.run(dbQuery)
    res.send('Status Updated')
  }
  if (priority !== undefined) {
    let dbQuery = `UPDATE todo SET priority = '${priority}' WHERE id = ${todoId}`
    let result = await db.run(dbQuery)
    res.send('Priority Updated')
  }
  if (todo !== undefined) {
    let dbQuery = `UPDATE todo SET todo = '${todo}' WHERE id = ${todoId}`
    let result = await db.run(dbQuery)
    res.send('Todo Updated')
  }

  if (category !== undefined) {
    let dbQuery = `UPDATE todo SET category = '${category}' WHERE id = ${todoId}`
    let result = await db.run(dbQuery)
    res.send('Category Updated')
  }

  if (dueDate !== undefined) {
    let dbQuery = `UPDATE todo SET due_date = '${dueDate}' WHERE id = ${todoId}`
    let result = await db.run(dbQuery)
    res.send('Due Date Updated')
  }
})

app.delete('/todos/:todoId/', async (req, res) => {
  let {todoId} = req.params
  let dbQuery = `DELETE FROM todo WHERE id = ?`
  let result = await db.run(dbQuery, [todoId])
  res.send('Todo Deleted')
})
instializedbAndServe()

module.exports = app
