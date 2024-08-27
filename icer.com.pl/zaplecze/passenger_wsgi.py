import importlib.util
import os
import sys


sys.path.insert(0, os.path.dirname(__file__))


spec = importlib.util.spec_from_file_location('wsgi', 'wsgi.py')
wsgi = importlib.util.module_from_spec(spec)
sys.modules['wsgi'] = wsgi
spec.loader.exec_module(wsgi)

application = wsgi.application
