var login=function(app, CouchDB, CradleDB){
    var nano=CouchDB().db("users");
    var cradle = CradleDB().database("users");
  app.get("/users/login/:email/:password", function(request, response){
    console.log(response);
    nano.view('login', 'by_email_and_password', {key:[request.params.email, request.params.password]}, function(err, body) {
         if (err) console.log(err);
         if (!body.rows.length) {
            //response.json(body);
            response.json(500);
         } else {
            response.status(200).json(body);
         }
      });
  });

  app.post("/users/signup", function(request, response){
      var req_body=request.body;
      nano.insert({first_name: req_body.first_name, last_name: req_body.last_name,
                   email: req_body.email, password: req_body.password,
                   sync_url: "https://trackpacker.cloudant.com/users",
                   friends: [] },
                   function(err, body){
					   if (!err)
                           response.status(200);
                   });
  });

  app.post("/users/upload", function(request, response){
      console.log(request.files);
  });
  
  app.get("/users/check_repeated_email/:email", function(request, response){
  	  nano.view('login', 'by_email', {key: request.params.email}, function(err, body){
		  if (!body.rows.length) response.json(body);
		  else response.status(200).json(body);
  	  });
  });

  app.get("/users/search/:input", function(request, response){
      var req_body = request.params;
      console.log(req_body.input);
      nano.view('search', 'by_fname_lname_email', {key: req_body.input }, function(err, body){
          if(err) {
              console.log("err: "+err);
              response.status(500).end();
          }
          else{
              console.log("search results: "+body);
              response.status(200).json(body);
          }
      });
  });

    app.post("/users/add_friends", function(request, response){
        var req_body = request.body;
        console.log("add friends!");
        nano.get(req_body.sender_id, function(err, body){
            if (err){
                console.log(err);
                response.status(500).end();
            }
            else{
                console.log(body);
                body.friends.push(req_body.sender_id);
                cradle.merge(req_body.accepter_id, {friends: body.friends}, function(merge_err, merge_res){

                });
                response.status(200).json(body).end();
            }
        });
    });

    app.get("/users/get_my_friends/:user_id", function(request, response){
        var req_body = request.params;
        console.log("get my friends");
        nano.get(req_body.user_id, function(err, body){
           var map_db=CouchDB().db("maps");
           console.log(body.friends);
           map_db.view("find_trips", "by_user_id",{keys: body.friends} , function(err_fetch, body_fetch){
              if (!err_fetch) {
                 console.log(JSON.stringify(body_fetch));
                 response.status(200).json(body_fetch).end();
              }
              else response.status(500).end();
           });
        });
    });
}

module.exports=login;
