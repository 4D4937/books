from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()
templates = Jinja2Templates(directory="templates")

# 数据库配置
db_config = {
    "host": os.getenv("DB_HOST"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "database": os.getenv("DB_NAME"),
    "port": os.getenv("DB_PORT")
}

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        
        # 只查询前10行数据
        cursor.execute("SELECT * FROM books LIMIT 10")
        books = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return templates.TemplateResponse(
            "index.html", 
            {"request": request, "books": books}
        )
    except Exception as e:
        return {"error": str(e)}
