const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const format = require("date-fns/format");
const isMatch = require("date-fns/isMatch");
var isValid = require("date-fns/isValid");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const convertRequestTOResponseObj = (dbObj) => {
  return {
    id: dbObj.id,
    todo: dbObj.todo,
    category: dbObj.category,
    priority: dbObj.priority,
    status: dbObj.status,
    dueDate: dbObj.due_date,
  };
};

const hasSearch_qProperty = (requestQuery) => {
  return requestQuery.search_q !== undefined;
};
const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};
const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};
const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};
const hasPriorityAndStatus = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};
const hasCategoryAndStatus = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};
const hasCategoryAndPriority = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

// API1
app.get("/todos/", async (request, response) => {
  const { search_q = "", category, status, priority } = request.query;
  let data = null;
  let getTodoQuery = "";

  switch (true) {
    case hasSearch_qProperty(request.query):
      getTodoQuery = `
             SELECT * from todo WHERE todo LIKE '%${search_q}%';

            `;
      data = await db.all(getTodoQuery);
      response.send(data.map((each) => convertRequestTOResponseObj(each)));
      break;

    case hasStatusProperty(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getTodoQuery = `
                SELECT * from todo WHERE status = '${status}';
                `;
        data = await db.all(getTodoQuery);
        response.send(data.map((each) => convertRequestTOResponseObj(each)));
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    case hasPriorityProperty(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        getTodoQuery = `
                SELECT * from todo WHERE priority = '${priority}';
                `;
        data = await db.all(getTodoQuery);
        response.send(data.map((each) => convertRequestTOResponseObj(each)));
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    case hasCategoryProperty(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        getTodoQuery = `
                SELECT * from todo WHERE category = '${category}';
                `;
        data = await db.all(getTodoQuery);
        response.send(data.map((each) => convertRequestTOResponseObj(each)));
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    case hasPriorityAndStatus(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodoQuery = `
                    SELECT * from todo WHERE status = '${status}' AND priority = '${priority}';
                    `;
          data = await db.all(getTodoQuery);
          response.send(data.map((each) => convertRequestTOResponseObj(each)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    case hasCategoryAndStatus(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodoQuery = `
                    SELECT * from todo WHERE status = '${status}' AND category = '${category}';
                    `;
          data = await db.all(getTodoQuery);
          response.send(data.map((each) => convertRequestTOResponseObj(each)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    case hasCategoryAndPriority(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          priority === "HIGH" ||
          priority === "MEDIUM" ||
          priority === "LOW"
        ) {
          getTodoQuery = `
                    SELECT * from todo WHERE priority = '${priority}' AND category = '${category}';
                    `;
          data = await db.all(getTodoQuery);
          response.send(data.map((each) => convertRequestTOResponseObj(each)));
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    default:
      getTodoQuery = `
            SELECT * from todo; 
            `;
      data = await db.all(getTodoQuery);
      response.send(data.map((each) => convertRequestTOResponseObj(each)));
      break;
  }
});

// API2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  getSpecificTodo = `
    SELECT * from todo WHERE id = '${todoId}';
    `;
  const data = await db.get(getSpecificTodo);
  response.send(data);
});

// API3
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  let data = null;
  console.log(isMatch(date, "yyyy-MM-dd"));
  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd");
    console.log(newDate);
    const getDateQuery = `
    SELECT * from todo WHERE due_date = '${newDate}';
    `;
    const data = await db.all(getDateQuery);
    response.send(data.map((each) => convertRequestTOResponseObj(each)));
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

// API4
app.post("/todos/", async (request, response) => {
  const { id, todo, status, priority, category, dueDate } = request.body;
  if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
    if (category === "WORK" || category === "HOME" || category === "LEARNING") {
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const postDate = format(new Date(dueDate), "yyyy-MM-dd");
          const createTodoQuery = `
                    INSERT INTO todo (id, todo, category, priority, status, due_date)
                    VALUES(${id}, '${todo}', '${category}', '${priority}', '${status}', '${postDate}');
                    `;
          await db.run(createTodoQuery);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Status");
  }
});

// API5
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumnQuery;
  const requestBody = request.body;
  const previousTodoQuery = `SELECT * from todo WHERE id = ${todoId}`;
  const previousTodo = await db.get(previousTodoQuery);
  const {
    todo = previousTodo.todo,
    category = previousTodo.category,
    status = previousTodo.status,
    priority = previousTodo.priority,
    dueDate = previousTodo.due_date,
  } = request.body;

  switch (true) {
    case requestBody.status !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        updateColumnQuery = `
                UPDATE todo SET todo = '${todo}', category = '${category}', priority = '${priority}', status = '${status}', due_date = '${dueDate}' WHERE id = ${todoId};
                `;
        await db.run(updateColumnQuery);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo status");
      }

      break;

    case requestBody.priority !== undefined:
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        updateColumnQuery = `
                UPDATE todo SET todo = '${todo}', category = '${category}', priority = '${priority}', status = '${status}', due_date = '${dueDate}' WHERE id = ${todoId};
                `;
        await db.run(updateColumnQuery);
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }

      break;

    case requestBody.category !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        updateColumnQuery = `
                UPDATE todo SET todo = '${todo}', category = '${category}', priority = '${priority}', status = '${status}', due_date = '${dueDate}' WHERE id = ${todoId};
                `;
        await db.run(updateColumnQuery);
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }

      break;
    case requestBody.status !== undefined:
      if (todo === "TO DO" || todo === "DONE" || todo === "IN PROGRESS") {
        updateColumnQuery = `
                UPDATE todo SET todo = '${todo}', category = '${category}', priority = '${priority}', status = '${status}', due_date = '${dueDate}' WHERE id = ${todoId};
                `;
        await db.run(updateColumnQuery);
        response.send("Todo Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Todo");
      }

      break;

    case requestBody.dueDate !== undefined:
      if (isMatch(dueDate, "yyyy-MM-dd")) {
        const newDate = format(new Date(dueDate), "yyyy-MM-dd");
        updateColumnQuery = `
                UPDATE todo SET todo = '${todo}', category = '${category}', priority = '${priority}', status = '${status}', due_date = '${newDate}' WHERE id = ${todoId};
                `;
        await db.run(updateColumnQuery);
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }

      break;
  }
});

// API6
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
    DELETE from todo WHERE id = '${todoId}';
    `;
  await db.get(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
