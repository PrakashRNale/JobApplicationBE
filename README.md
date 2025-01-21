Deployment process

build Image
docker build --platform linux/amd64 -t prakashaws123/test-application .

push image
docker push prakashaws123/test-application  

Access EC2 using cmd connect

Check existing containers ==> sudo docker ps -a
stop containers ==> sudo doocker stop containerName (do it for FE and BE)
delete containers ==> sudo docker rm containerId (do it for FE and BE)
check images ==> sudo docker images
delete images ==> sudo docker rmi imageId


Create containers ==> it will automaticall pull latest images from the docke hub
BE ==> sudo docker run -d -p 5000:80 prakashaws123/test-application  => 5000 port is for outside ==> if local appication is running o some other port then use tha tport instaed of 80

FE ==> sudo docker run -d -p 80:80 prakashaws123/jobapp-fe  ==> use port 80 so that we can directly access ui on browser

sudo docker run -d -p 5000:8000 prakashaws123/test-application
