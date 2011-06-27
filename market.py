#!/usr/bin/python

import os
import logging
import datetime
import urlparse
import uuid
from datetime import datetime, timedelta
import time

import tornado.httpserver
import tornado.ioloop
import tornado.web
import tornado.escape
import tornado.options
import tornado.websocket
from pika.adapters.tornado_connection import TornadoConnection
import pika

from bson.objectid import ObjectId

from htmlentitydefs import codepoint2name

from variables import *

LISTENERS = []

class PikaClient(object):
    def __init__(self):
        self.connected = False
        self.connecting = False
        self.connection = None
        self.channel = None

        self.messages = list()
        self.pending = list()

    def connect(self):
        if self.connecting:
            logging.error("PikaClient already connected")
            return
        logging.info("connecting to RabbitMQ")
        self.connecting = True
        param = pika.ConnectionParameters(host='10.212.66.144', port=5672)
        self.connection = TornadoConnection(param, on_open_callback=self.on_connected)
        self.connection.add_on_close_callback(self.on_closed)

    def on_connected(self, connection):
        pika.log.info('PikaClient: Connected to RabbitMQ on 10.212.66.144:5672')
        self.connected = True
        self.connection = connection
        self.connection.channel(self.on_channel_open)

    def on_channel_open(self, channel):
        pika.log.info('PikaClient: Channel Open, Declaring Exchange')
        self.channel = channel
        self.channel.exchange_declare(exchange='market', type="fanout", callback=self.on_exchange_declared)

    def on_exchange_declared(self, frame):
        logging.info("Exchange declared. Declaring Queue")
        self.channel.queue_bind(exchange='market', queue='market', callback=self.on_queue_bound)

    def on_queue_bound(self, frame):
        logging.info('Queue Bound, Issuing Basic Consume')
        self.channel.basic_consume(consumer_callback=self.on_pika_message, queue='market', no_ack=True)

    def on_pika_message(self, channel, method, header, body):
        logging.info('Message receive, %s'% body)
        # Append it to our messages list
        # self.messages.append(body)
        symbol, uuid = body.split("|")
        trend = db.get("""SELECT * FROM trends WHERE uuid = %s""", uuid)
        
        for listener in LISTENERS:
            date = datetime.now()
            date = date-timedelta(hours=5)
            date = date.strftime("%Y-%m-%d %I:%M:%S")
            html = uuid +"|<p><span class='label labelcolor1'>"+date+" "+symbol+" </span><span class='trend' id='"+uuid+"'>%s trend discovered</span></p>"% trend['type']
            listener.write_message(html)

    def on_closed(self, connection):
        tornado.ioloop.IOLoop.instance().stop()

    def send_message(self, body):
        logging.info("Sending message")
        self.channel.basic_publish(exchange='market', routing_key='', body=body)

    def get_messages(self):
        # Get the messages to return, then empty the list
        output = self.messages
        self.messages = list()
        return output        


class Application(tornado.web.Application):
    def __init__(self):
        handlers = [
            (r"/", MainHandler),
            (r"/feed/", FeedHandler),
            (r"/trend/", TrendHandler),

            (r"/ws/", EchoWebSocket),
            (r"/pika/", PikaSocket),
            (r"/pikareceive/", PikaReceive),
            ]
        settings = dict(
            cookie_secret="43oETzKXQAGaYdkL5gEmGeJJFuYh7EQnp2XdTP1o/Vo=",
            login_url="/",
            template_path=os.path.join(os.path.dirname(__file__), "templates"),
            static_path=os.path.join(os.path.dirname(__file__), "static"),
            site_name='chundle',
            xsrf_cookies=True,
        )
        tornado.web.Application.__init__(self, handlers, **settings)

        self.db = db


class BaseHandler(tornado.web.RequestHandler):
    @property
    def db(self):
        return self.db


class MainHandler(BaseHandler):
    def get(self):
        ticks = db.query("SHOW TABLES")
        trends = db.query("SELECT * FROM trends ORDER BY created desc LIMIT 50")
        symbols = []
        dbtrends = []

        for t in ticks:
            symbols.append(t['Tables_in_market'])
        for trend in trends:
            temp = {}
            date = datetime.fromtimestamp(int(trend['created']))
            date = date-timedelta(hours=5)
            date = date.strftime("%Y-%m-%d %I:%M:%S")            
            temp['date'] = date
            temp['symbol'] = trend['symbol']
            temp['trendtype'] = trend['type']
            temp['uuid'] = trend['uuid']

            dbtrends.append(temp)

        self.render("index.html", symbols=symbols, dbtrends=dbtrends)


class EchoWebSocket(tornado.websocket.WebSocketHandler):
    def open(self):
        LISTENERS.append(self)

    def on_message(self, message):
        pass

    def on_close(self):
        try:
            LISTENERS.remove(self)
        except:
            pass


class TrendHandler(BaseHandler):
    def get(self):
        uuid = self.get_argument("uuid", None)

        trend = db.get("""SELECT * FROM trends WHERE uuid = %s""", uuid)
        ticks = db.query("""SELECT date,open,close,high,low,id from %s where date <= %s and date >= %s order by date"""% (trend['symbol'], trend['date'], int(trend['date'])-100))

        hold = []
        for tick in ticks:
            tick['date'] = datetime.fromordinal(int(tick['date']))
            tick['date'] = tick['date'].strftime("%Y-%m-%d %I:%M:%S")                        
            hold.append([tick['date'], tick['open'], tick['high'], tick['low'], tick['close']])

        lines = []
        line = []
        line.append(25)
        line.append(trend['p1'])

        lines.append(line)

        line = []
        line.append(25)
        line.append(trend['p2'])

        lines.append(line)

        data = {'trend': 
                {"label" : trend['symbol'],
                "data" : hold},

                'lines': lines,
                'trendtype': trend['type']
                }

        self.write(tornado.escape.json_encode(data))


class FeedHandler(BaseHandler):
    def get(self):
        symbol = self.get_argument("symbol", None)

        if not symbol:
            return

        ticks = db.query("""SELECT date,open,close,high,low,id from %s order by date"""% symbol)
        hold = []
        
        for tick in ticks:
            tick['date'] = datetime.fromordinal(int(tick['date']))
            tick['date'] = tick['date'].strftime("%Y-%m-%d %I:%M:%S")
            hold.append([tick['date'], tick['open'], tick['high'], tick['low'], tick['close']])

        data = {"label" : symbol,
                "data" : hold
                }
        
        self.write(tornado.escape.json_encode(data))


class PikaSocket(BaseHandler):
    def get(self):
        # Send a sample message
        self.application.pika.sample_message(self.request)

        return


class PikaReceive(BaseHandler):
    def get(self):
        # Send a sample message
        messages = self.application.pika.get_messages()

        return


def main():
    Application.pika = PikaClient()

    http_server = tornado.httpserver.HTTPServer(Application(), xheaders=True)
    http_server.listen(options.port)
    tornado.ioloop.IOLoop.instance().add_timeout(500, Application.pika.connect)
    tornado.ioloop.IOLoop.instance().start()

    logging.info("Market web server started successfully")

if __name__ == "__main__":
    tornado.options.parse_command_line()
    logging.info("Starting market web server")

    main()
