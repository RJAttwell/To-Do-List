//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-richard:yb2E6Qj7t4FmfUq@todocluster.s0k6uam.mongodb.net/todolistDB", {
  useNewUrlParser: true,
});

const itemsSchema = new mongoose.Schema({
  itemName: String,
});

//Model name is usually captialised
const Item = mongoose.model("Item", itemsSchema);

//Create new list documents based of the list model below
const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema],
});

const List = mongoose.model("List", listSchema);

//Create new documents

const item1 = new Item({
  itemName: "Welcome to your To-Do List",
});

const item2 = new Item({
  itemName: "Click the plus sign to add a new item",
});

const item3 = new Item({
  itemName: "Click the checkbox to check off an item",
});

//Insert the items into an array
const defaultItems = [item1, item2, item3];

app.get("/", function (req, res) {
  //Gives an array back as a result
  Item.find({})
    .then(function (foundItems) {
      if (foundItems.length === 0) {
        //Insert the items into our Item collection using the .insertMany method
        Item.insertMany(defaultItems)
          .then(function () {
            console.log("Successfully added all items");
          })
          .catch(function (error) {
            console.log(error);
          });

        //Redirect back to the root route and it won't fall into the if block, it'll render the else block
        res.redirect("/");
      } else {
        res.render("list", { listTitle: "Today", newListItems: foundItems });
      }
    })
    .catch(function (error) {
      console.log(error);
    });
});

app.post("/", function (req, res) {
  //Refers to the text the user entered when adding a new item
  const itemText = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    itemName: itemText,
  });

  //If
  if (listName === "Today") {
    //Save the document into our collection
    item.save();

    //Redirects to home route and our changes will be rendered on the screen automatically without need for manual refresh
    res.redirect("/");
  } else {
    List.findOne({ name: listName }).then(function (foundList) {
      //Push new item into our array of items
      foundList.items.push(item);
      //Update with new data
      foundList.save();
      //Redirect to route where the user came from
      res.redirect("/" + listName);
    });

    //Form will make a post request that is handled through the root route. Server will catch it
    //in the app.post("/"). If the page title is "Today" (Which is the home page), then we'll do a regular item.save
    //and redirect but if it's from a different list, it'll trigger the else statement
  }
});

app.post("/delete", function (req, res) {
  const checkedItemID = req.body.checkbox;
  let listName = req.body.listName;

  //Check if item is being deleted on home page or custom list page
  if ((listName === "Today")) {
    //Home route
    Item.findByIdAndRemove(checkedItemID)
      .then(function () {
        console.log("Successfully deleted the item");
        res.redirect("/");
      });
  } else {
    //Custom list route

    //Remove document from an array
    //Pull an item from a particular array and then pull the document using their ID
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemID } } }
    ).then(function (foundList) {
      res.redirect("/" + listName);
    });
  }
});

//Create new custom lists
app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  //Only returns one object
  List.findOne({ name: customListName }).then(function (foundList) {
    if (!foundList) {
      //Create a new list
      const list = new List({
        name: customListName,
        items: defaultItems,
      });

      //Saves to the list collection
      list.save();

      //Redirects to new list
      res.redirect("/" + customListName);
    } else {
      //Show an existing list
      res.render("list", {
        listTitle: foundList.name,
        newListItems: foundList.items,
      });
    }
  });
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
