'use strict';
                                                        //  ||
                                                        //  \/          make sure to install the used libraries for this program to be functional!
const cheerio = require("cheerio");                     //npm install cheerio
const express = require("express");                     //npm install express
const rp = require('request-promise');                  //npm intall request-promise

const app = express();
const port = 1337;
const images = [];
const links = [];

var text = '';

let index = Math.floor(Math.random() * 2273);           //2273 is the length of list 'links'

const url = 'https://en.wikipedia.org/wiki/List_of_dinosaur_genera';            //all images and text scraped from wikipedia

createServer(index);

function createServer(index) {
    rp(url).then(html => {
        const $ = cheerio.load(html);
        const linkObjects = $('a');                                 //scrapes all HTML objects of type 'a' and stores it in linkObjects
        images.length = 0;                                          //resets the length of images, text, and links in case a webpage with no image was found and the function was run again
        links.length = 0;
        text = '';

        let newUrl = 'https://en.wikipedia.org/wiki/';              //all the links taken from wikipedia are redirects, not full links

        for (let i = 80; i < 3184; i++) {  //80 to 3184 is the scope of usable links from the dinosaur list scraped from wikipedia. 
            if (!linkObjects[i].attribs.href.includes("/wiki/File:") && linkObjects[i].attribs.href.includes('/wiki/')) { //only appends a link to linkObjects if it is not an image and it does redirect to wikipedia
                links.push({ href: linkObjects[i].attribs.href, title: linkObjects[i].attribs.title });                   //pushes the link and title of the link to a list
            }
        }

        newUrl = "https://en.wikipedia.org" + links[index].href;    //adds the redirect link to the wikipedia homepage to make a full link

        rp(newUrl).then(html => {                                   //scrapes the url which was scraped from the original page
            const $ = cheerio.load(html);                           //initializes cheerio
            const imageObjects = $('img');                          //stores all html tags of type 'img' in an object, targeting imagas
            const textObjects = $('p');                             //stores all html tags of type 'p' in an object, targeting text

            text = textObjects.text();                              //takes textObject and converts it into the raw text in the html tag
            while (0 == text.search(/\r|\n/)) {                     //searches the text for line breaks
                text = text.substring(1, textObjects.text().length);        //removes the first linebreak if found from the text
            }

            text = (text.substring(0, text.search(/\r|\n/)));                      //creates a second substring that contains only the first paragraph of the scraped article

            for (let x = 0; x < 9; x++) {                                          //removes all the footnotes from wikipedia as it wouldn't serve a purpose on my webpage
                text = text.replace('[' + x + ']', '');
            }
                    
            for (let x = 0; x < imageObjects.length; x++) {                      
                if (imageObjects[x].attribs.src.includes(links[index].title)) {    //adds all images that contain the title of the webpage to the list 'images
                    images.push({
                        src: imageObjects[x].attribs.src
                    });
                }
            }
            if (images.length != 0) {
                startServer(index);                         //if it finds a webpage with images, it starts the server with the scraped content from that page  
            }
            else {                                          //if the webpage does not have images, it runs the function again with a different index
                console.log(images.length + " images found, restarting");
                index = Math.floor(Math.random() * links.length);
                createServer(index);
            }
        })
            .catch(err => {
                console.log(err + index);                   //catches errors
            })
    })
        .catch(err => {
            console.log(err + index);                       //catches errors
        })
}

function startServer(ind) {
    app.listen(port, () => { console.log("listening on port  " + port); });                               //initializes a nodejs server on port 1337 (the default port)
    app.get("/", (req, res) => {                                                                          //registers a route handler to the root route

        res.send(                                                                                         //sends all the information scraped to the created server as html code
            "<html> <h1>" + links[ind].title + "</h1>  <img src ='" + images[0].src + "'> <h3>" + text + "</h3> <h5>" + 'All image and text are scraped from Wikipedia' + "</h5> <a href = " + "https://www.wikipedia.org" + links[ind].href + ">" + "wikipedia.org" + links[ind].href + "</a></html>");                                  //sends the first image scraped from the corresponding wikipedia page to be displayed on the node server
    });
}
