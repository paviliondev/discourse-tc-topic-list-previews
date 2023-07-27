import { ajax } from "discourse/lib/ajax";
import { popupAjaxError } from "discourse/lib/ajax-error";
import ShareTopicModal from "discourse/components/modal/share-topic";
import { getOwner } from "@ember/application";

var shareTopic = function (topic) {
  getOwner(topic).lookup("service:modal").show(ShareTopicModal, {
    model: {
      category: topic.category,
      topic: topic,
    }
  })
};

var addLike = function (postId) {
  ajax("/post_actions", {
    type: "POST",
    data: {
      id: postId,
      post_action_type_id: 2,
    },
    returnXHR: true,
  }).catch(function (error) {
    popupAjaxError(error);
  });
};

var sendBookmark = function (topic_id, topic_post_id, bookmarked) {
  if (bookmarked) {
    const data = {
      reminder_type: null,
      reminder_at: null,
      name: null,
      bookmarkable_id: topic_post_id,
      bookmarkable_type: 'Post',
    };
    return ajax("/bookmarks", {
      type: "POST",
      data,
    }).catch(function (error) {
      popupAjaxError(error);
    });
  } else {
    return ajax(`/t/${topic_id}/remove_bookmarks`, {
      type: "PUT",
    }).catch(function (error) {
        popupAjaxError(error);
      });
  }
};

var removeLike = function (postId) {
  ajax("/post_actions/" + postId, {
    type: "DELETE",
    data: {
      post_action_type_id: 2,
    },
  }).catch(function (error) {
    popupAjaxError(error);
  });
};

export { shareTopic, addLike, sendBookmark, removeLike };
