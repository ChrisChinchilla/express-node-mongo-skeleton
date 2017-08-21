var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'), //mongo connection
    bodyParser = require('body-parser'), //parses information from POST
    methodOverride = require('method-override'); //used to manipulate POST

//Any requests to this controller must pass through this 'use' function
//Copy and pasted from method-override
router.use(bodyParser.urlencoded({
    extended: true
}))
router.use(methodOverride(function (req, res) {
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
        // look in urlencoded POST bodies and delete it
        var method = req.body._method
        delete req.body._method
        return method
    }
}))

//build the REST operations at the base for articles
//this will be accessible from http://127.0.0.1:3000/articles if the default route for / is left unchanged
router.route('/')
//GET all articles
    .get(function (req, res, next) {
        //retrieve all articles from Monogo
        mongoose.model('Article').find({}, function (err, articles) {
            if (err) {
                return console.error(err);
            } else {
                //respond to both HTML and JSON. JSON responses require 'Accept: application/json;' in the Request Header
                res.format({
                    //HTML response will render the index.jade file in the views/articles folder. We are also setting "articles" to be an accessible variable in our jade view
                    html: function () {
                        res.render('articles/index', {
                            title: 'All my Articles',
                            "articles": articles
                        });
                    },
                    //JSON response will show all articles in JSON format
                    json: function () {
                        res.json(articles);
                    }
                });
            }
        });
    })
    //POST a new article
    .post(function (req, res) {
        // Get values from POST request. These can be done through forms or REST calls. These rely on the "name" attributes for forms
        var name = req.body.name;
        var body = req.body.body;
        var published = req.body.published;
        //call the create function for our database
        mongoose.model('Article').create({
            name: name,
            body: body,
            published: published
        }, function (err, article) {
            if (err) {
                res.send("There was a problem adding the information to the database.");
            } else {
                //Article has been created
                console.log('POST creating new article: ' + article);
                res.format({
                    //HTML response will set the location and redirect back to the home page. You could also create a 'success' page if that's your thing
                    html: function () {
                        // If it worked, set the header so the address bar doesn't still say /adduser
                        res.location("articles");
                        // And forward to success page
                        res.redirect("/articles");
                    },
                    //JSON response will show the newly created article
                    json: function () {
                        res.json(article);
                    }
                });
            }
        })
    });

/* GET New Article page. */
router.get('/new', function (req, res) {
    res.render('articles/new', {
        title: 'Add New Article'
    });
});

// route middleware to validate :id
router.param('id', function (req, res, next, id) {
    //console.log('validating ' + id + ' exists');
    //find the ID in the Database
    mongoose.model('Article').findById(id, function (err, article) {
        //if it isn't found, we are going to repond with 404
        if (err) {
            console.log(id + ' was not found');
            res.status(404)
            var err = new Error('Not Found');
            err.status = 404;
            res.format({
                html: function () {
                    next(err);
                },
                json: function () {
                    res.json({
                        message: err.status + ' ' + err
                    });
                }
            });
            //if it is found we continue on
        } else {
            //uncomment this next line if you want to see every JSON document response for every GET/PUT/DELETE call
            //console.log(article);
            // once validation is done save the new item in the req
            req.id = id;
            // go to the next thing
            next();
        }
    });
});

router.route('/:id')
    .get(function (req, res) {
        mongoose.model('Article').findById(req.id, function (err, article) {
            if (err) {
                console.log('GET Error: There was a problem retrieving: ' + err);
            } else {
                console.log('GET Retrieving ID: ' + article._id);
                var articlepublished = article.published.toISOString();
                articlepublished = articlepublished.substring(0, articlepublished.indexOf('T'))
                res.format({
                    html: function () {
                        res.render('articles/show', {
                            "articlepublished": articlepublished,
                            "article": article
                        });
                    },
                    json: function () {
                        res.json(article);
                    }
                });
            }
        });
    });

router.route('/:id/edit')
//GET the individual article by Mongo ID
    .get(function (req, res) {
        //search for the article within Mongo
        mongoose.model('Article').findById(req.id, function (err, article) {
            if (err) {
                console.log('GET Error: There was a problem retrieving: ' + err);
            } else {
                //Return the article
                console.log('GET Retrieving ID: ' + article._id);
                var articlepublished = article.published.toISOString();
                articlepublished = articlepublished.substring(0, articlepublished.indexOf('T'))
                res.format({
                    //HTML response will render the 'edit.jade' template
                    html: function () {
                        res.render('articles/edit', {
                            title: 'Article' + article._id,
                            "articlepublished": articlepublished,
                            "article": article
                        });
                    },
                    //JSON response will return the JSON output
                    json: function () {
                        res.json(article);
                    }
                });
            }
        });
    })
    //PUT to update a article by ID
    .put(function (req, res) {
        // Get our REST or form values. These rely on the "name" attributes
        var name = req.body.name;
        var body = req.body.body;
        var published = req.body.published;

        //find the document by ID
        mongoose.model('Article').findById(req.id, function (err, article) {
            //update it
            article.update({
                name: name,
                body: body,
                published: published
            }, function (err, articleID) {
                if (err) {
                    res.send("There was a problem updating the information to the database: " + err);
                } else {
                    //HTML responds by going back to the page or you can be fancy and create a new view that shows a success page.
                    res.format({
                        html: function () {
                            res.redirect("/articles/" + article._id);
                        },
                        //JSON responds showing the updated values
                        json: function () {
                            res.json(article);
                        }
                    });
                }
            })
        });
    })
    //DELETE a Article by ID
    .delete(function (req, res) {
        //find article by ID
        mongoose.model('Article').findById(req.id, function (err, article) {
            if (err) {
                return console.error(err);
            } else {
                //remove it from Mongo
                article.remove(function (err, article) {
                    if (err) {
                        return console.error(err);
                    } else {
                        //Returning success messages saying it was deleted
                        console.log('DELETE removing ID: ' + article._id);
                        res.format({
                            //HTML returns us back to the main page, or you can create a success page
                            html: function () {
                                res.redirect("/articles");
                            },
                            //JSON returns the item with the message that is has been deleted
                            json: function () {
                                res.json({
                                    message: 'deleted',
                                    item: article
                                });
                            }
                        });
                    }
                });
            }
        });
    });

module.exports = router;
