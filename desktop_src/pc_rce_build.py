
#!/usr/bin/python
import os
import json
import re

YELLOW = '\033[33m'
BLUE = '\033[34;1m'
GREEN = '\033[32m'
RED = '\033[31;1m'
MAGENTA = '\033[35;1m'

ENDC = '\033[0m'
BOLD = '\033[1m'
UNDERLINE = '\033[4m'

configFile = open("./config.js","r+");
config = oconfigFile.read()

startPos = config.index("{");
endPos = config.index("if(isTest)");
jsonStr = config[startPos:endPos];
jsonStr = re.sub(r"(,?)(\w+?)\s*?:",r"\1'\2':", jsonStr);
jsonStr = jsonStr.replace("'","\"");
environmentDict = json.loads(jsonStr);


version = os.getenv('Version');
build = os.getenv('Build');

appIndex = os.getenv('AppIndex');
appHost = os.getenv('AppHost');
reportUrl = os.getenv('ReportUrl');
appId = os.getenv('AppId');
protocal = os.getenv('Protocal');

productName = os.getenv('ProductName');
description = os.getenv('Description');
appName = os.getenv('AppName');
author = os.getenv('Author');

environmentDict['APP_ID']=appId;
environmentDict['APP_INDEX']=appIndex;
environmentDict['PROTOCAL']=protocal;
environmentDict['APP_HOST']=appHost;
environmentDict['REPORT_URL']=reportUrl;

environmentDict['PACKAGE']['PRODUCTNAME']=productName;
environmentDict['PACKAGE']['APPNAME']=appName;
environmentDict['PACKAGE']['VERSION']=version;
environmentDict['PACKAGE']['DESCRIPTION']=description;
environmentDict['PACKAGE']['AUTHOR']=author;

print('%s*** %s ***' % (YELLOW, environmentDict));

configFile.truncate();
fileObject.write(jsObj);  
fileObject.close();