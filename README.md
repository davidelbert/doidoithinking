# doidoithinking
Working on a cleaner DOI generating web form for PARADIM

# Docker build and run:

#### Note: Make sure you have Node.js installed on your system before running npm commands. You can download it from https://nodejs.org/ – not sure if you need Node.js where you build the image

## Build the container
docker build -t doi-form .

## Run the container
docker run -p 3000:3000 doi-form

