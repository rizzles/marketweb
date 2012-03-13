import re
import time

from tornado.options import define, options
import tornado.database

define("port", default=80, help="run on the given port", type=int)

db = tornado.database.Connection(
    host='10.98.49.126:3307', database='ticks',
    user='nick', password='mohair94')

