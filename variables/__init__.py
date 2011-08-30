import re
import time

from tornado.options import define, options
import tornado.database

define("port", default=80, help="run on the given port", type=int)

db = tornado.database.Connection(
    host='184.73.152.25:3307', database='ticks',
    user='nick', password='mohair94')

