#!/usr/bin/env python3

import os
import sys
import json

if len(sys.argv) < 2 or not os.path.exists(sys.argv[1]):
	sys.exit('\n  Must get existing file as first argument\n')

with open(sys.argv[1], 'r') as file:
	file_cont = file.read()

epg = []
data = file_cont.split('\n')
for line in data:
	time_date, data = line.split('                  : da:')
	tmp, date, start = time_date.split(' ')
	description, data2 = data.split(' / da: / ')
	category, time = data2.split(' /  / ')
	duration = time[:-2]
	data_set = 	{
					"date"			:	date,
					"duration"		: 	duration.split(' ')[0],
					"start"			:	start,
					"description"	        :	description,
					"category"		:	category.split(' ')[0]
				}
	epg.append(data_set)
print(json.dumps(epg, indent=4))
