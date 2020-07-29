# Gesture_Recognition  

* Dockerfile  
```
FROM nginx:alpine
COPY . /usr/share/nginx/html```  

* CLI on folder ```docker build -t webserver-image:v1 .```
```sudo docker images```   
```docker run -d -p 80:80 webserver-image:v1```
```curl docker```  
