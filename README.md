# cs103a-cpa02

## Demo Video
https://drive.google.com/drive/folders/1H1Lzu7Vy114FLd5T8YEgjNj-stPsd0Z_?usp=sharing


## Using the app
Visit the cloud-based app at https://mysterious-atoll-60410.herokuapp.com

This app basically allows people to create polls and fill out the polls of others. So you could come up with any (multiple choice) question, throw it out there, and see if people respond. 

You will first be prompted to log in and directed to the login page. The app will be inaccessible if you aren't logged in. Create a new account if this is your first time using the app. 

Clicking "View All Polls" on the home page will direct you to a list of every poll that exists. For each poll, you can click "Statistics" to see the breakdown of which responses each question has gotten. Clicking "Fill Out" will allow you to submit your own answers to the poll, but an account can only submit to a given poll once. 

Clicking "Create A Poll" will bring you to a poll creation page. Upon creating a poll, it will be added to the list, where other users can then view it as they would any other poll. (Note, however, that a poll cannot be removed or disabled once it is posted)


## Running the app locally
Follow the steps below to run the app from your computer, without needing an internet connection

Requirements:
  MongoDB (Community Edition works fine): https://www.mongodb.com/docs/manual/administration/install-community/
  Node: https://nodejs.org/en/download/

First, download the app from the github: https://github.com/clima13/cs103a-cpa02
You can either do 'git clone https://github.com/clima13/cs103a-cpa02' in the bash shell or download the .zip and extract it

*The version of the app on github is already made to run locally*

Run 'npm install' from the app folder to install necessary modules

Start a local Mongo server by navigating to public/data in the app folder and running 'mongod --dbpath .' in the bash shell

While the server is running, run 'npm start' from the app folder. If successful, the shell should display the following message:
"connecting on port 5000
we are connected!!!"

Then, just visit localhost:5000 on your browser to use the app. 

All data is stored locally, so you can't access the primary poll database, but no internet is required either. 