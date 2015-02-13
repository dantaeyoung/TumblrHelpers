
/* this aggregates multiple tumblr blogs together into one. example: http://adr2-sp5.tumblr.com. */
/* dan@dantaeyoung.com Feb 2015 */

var tAgg = {};

tAgg.tumblrKey = "api_key=LX9NT4aMcjVVRUBY0TJ4XE004NUt8F2C572CQlz9vT0SWm37G7";
tAgg.tumblrAPI = "https://api.tumblr.com/v2/blog/";
tAgg.myName = 'adr2-sp15';



tAgg.writePost = function(item) {
	
	if(item !== "undefined") {
	var contentString = "";
	if(item.type == "photo") {
		$.each(item.photos, function(i, photo) {
			//console.log(photo.original_size.url);
			contentString += '<div class=img_container><img src=' + photo.original_size.url + '></div>';
		});
	}
	if(item.type == "video") {
			contentString += '<div class=embed_container>' + _.max(item.player, 'width').embed_code + '</div>';
	}
	
	var tagString = "";
	if(item.tags) {
		tagString += "Tags: ";
		$.each(item.tags, function(i, tag) {
			tagString +=  '<a class="' + tag + '" href="http://adr2-sp15.tumblr.com/tagged/' + tag + '">• ' + tag + '</a>&nbsp;';
		});
	}

	
	$("#all_posts").append('\
<div class="postwrapper">\
 <div class="post ' + item.type + '"><div class="realpost">\
   ' + contentString + '\
 </div></div>\
 <div class="sidebar">\
   <div class="caption">\
	 <div class="caption-text">\
		' + item.caption + '\
	 </div>\
   </div>\
   <div class="permalink">\
	 <div class="tags">\
	' + tagString + '\
	 <br>\
	 </div>\
	 <a href="https://www.tumblr.com/reblog/' + item.id + '/' + item.reblog_key + '">&#8634; Reblog</a><br />\
   </div>\
 </div>\
</div>');
					
	}
	
}



tAgg.retrieveAllFromTumblr = function (tumblr_name, callback, offset, count, posts) {
	

	var done = false;
	offset = (typeof offset === "undefined") ? 0 : offset;
	count = (typeof count === "undefined") ? 0 : count;
	posts = (typeof posts === "undefined") ? [] : posts;
	tAgg.blogsLoadedFirstPage = (typeof tAgg.blogsLoadedFirstPage === "undefined") ? {} : tAgg.blogsLoadedFirstPage;

	var def = new $.Deferred();
	
	var apiPath = tAgg.tumblrAPI + tumblr_name + ".tumblr.com/posts?callback=?&limit=20&offset=" + offset + "&" + tAgg.tumblrKey;
	

	var url = window.location.href;
	if(url.search(/tagged/) > 0) {
		var tag = url.split("tagged/")[1].trim()
		apiPath += "&tag=" + tag;
	}

	$.getJSON(apiPath, function(data) {
		if(data.response.posts) {
			$.each(data.response.posts, function(i, item) {
				 tAgg.allPostsList.push(item);
				
			});
		}
		
		tAgg.blogsLoadedFirstPage[tumblr_name] = true;
		tAgg.maybeLoadFirstPage();
		
		if (data.response.posts && data.response.posts.length == 20) {
			tAgg.retrieveAllFromTumblr(tumblr_name, callback, offset + 20, count + 20, posts).then(function() {
				def.resolve(posts);
			});
		} else {
			def.resolve(posts);
			console.log("done!");
		}
		
	})
	
	return def.promise();
};

tAgg.maybeLoadFirstPage = function() {
	
	if(_.keys(tAgg.blogsLoadedFirstPage).length == tAgg.NumberOfBlogs) {
		if(!("loaded" in tAgg.blogsLoadedFirstPage)) {
			tAgg.allPostsList = _.sortBy(tAgg.allPostsList, "timestamp").reverse();
			console.log("writing while loading!")
			tAgg.writePosts(20);
			tAgg.blogsLoadedFirstPage['loaded'] = true;
		}
	}
}

tAgg.loadFromAllAdr2 = function() {
	
  tAgg.allPostsList = [];

  tAgg.NumberOfBlogs = 4; //hacky, but hey. set this part manually. to be updated later.
  $.when(
	tAgg.retrieveAllFromTumblr('adr2-nagy-sp15'),
	tAgg.retrieveAllFromTumblr('adr2-kurgan-sp15'),
	tAgg.retrieveAllFromTumblr('adr2-dennis-sp15'),
	tAgg.retrieveAllFromTumblr('adr2-taeyoung-sp15')
	)
	.then(function() {
		tAgg.allPostsList = _.sortBy(tAgg.allPostsList, "timestamp").reverse();
  });
 
  tAgg.initPosts = false;

}

tAgg.writePosts = function(n) {
	console.log("writing " + n + " items");
	tAgg.loadedOffset = (typeof tAgg.loadedOffset === "undefined") ? 0 : tAgg.loadedOffset;
 
	if(tAgg.allPostsList) {
	
		_.each(_.range(tAgg.loadedOffset, tAgg.loadedOffset + n), function(i) {
			tAgg.writePost(tAgg.allPostsList[i]);
		});
		
		tAgg.loadedOffset += n;
	}
}

tAgg.loadMore = function() {
	setTimeout(function() { tAgg.taskFired = false; }, 1500);
	console.log('load');
	tAgg.writePosts(20);
}


/*** DOCUMENT EVENTS ***/

$(window).scroll(function(){

	if($(window).scrollTop() >= $(document).height() - $(window).height()) {
		
		if(!tAgg.taskFired){
			tAgg.taskFired = true;
			$("#loading_gif").css("display", "block");
			tAgg.loadMore();
			//setTimeout(loadMoreMabs, 1500);
		}
	}

});



$(document).ready(function() {
	tAgg.loadFromAllAdr2();
	$("#topcontrol img").attr("src", "http://static.tumblr.com/jaodihj/bTfnirjwi/up_arrow_50.svg");
});

