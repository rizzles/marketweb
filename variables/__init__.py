import re
import time

from tornado.options import define, options
import tornado.database

define("port", default=8000, help="run on the given port", type=int)

db = tornado.database.Connection(
    host='ec2-184-73-152-25.compute-1.amazonaws.com:3307', database='market',
    user='nick', password='mohair94')

