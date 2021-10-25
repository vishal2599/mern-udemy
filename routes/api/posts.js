import express from 'express';
import { check, validationResult } from 'express-validator';
import auth from '../../middleware/auth.js';
import Post from '../../models/Post.js';
import Profile from '../../models/Profile.js';
import User from '../../models/User.js';
const router = express.Router();

// @route       POST api/posts
// @desc        Create a post
// @access      Private
router.post('/', [ auth, [
    check('text', 'Text is required').notEmpty()
]], async (req, res) => {
    const errors = validationResult(req);
    if( !errors.isEmpty() ){
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const user = await User.findById(req.user.id).select('-password');
        const newPost = new Post({
            text: req.body.text,
            name: user.name,
            avatar: user.avatar,
            user: req.user.id
        });
        const post = await newPost.save();
        res.json(post);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }

});

// @route       GET api/posts
// @desc        Get all posts
// @access      Private

router.get('/', auth, async (req, res) => {
    try {
        const posts = await Post.find().sort({ date: -1 });
        res.json(posts);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route       GET api/posts/:post_id
// @desc        Get post by id
// @access      Private

router.get('/:post_id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.post_id);
        if( !post ){
            return res.status(404).json({ msg: 'Post not found' });
        }
        res.json(post);
    } catch (err) {
        console.error(err.message);
        if( err.kind === 'ObjectId' ){
            return res.status(404).json({ msg: 'Post not found' });
        }
        res.status(500).send('Server Error');
    }
});

// @route       DELETE api/posts/:post_id
// @desc        Delete a post by id
// @access      Private

router.delete('/:post_id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.post_id);

        if( !post ){
            return res.status(404).json({ msg: 'Post not found' });
        }
        //  Check if user owns this post
        if( post.user.toString() !== req.user.id ){
            return res.status(401).json({ msg: 'User not authorized' });
        }

        await post.remove();
        res.json({ msg: 'Post removed' });
    } catch (err) {
        console.error(err.message);
        if( err.kind === 'ObjectId' ){
            return res.status(404).json({ msg: 'Post not found' });
        }
        res.status(500).send('Server Error');
    }
});

// @route       PUT api/posts/like/:post_id
// @desc        Like a post
// @access      Private

router.put('/like/:post_id', auth, async (req,res) => {
    try {
        const post = await Post.findById(req.params.post_id);
        // Check if the post is already liked by this user
        if( post.likes.filter(like => like.user.toString() === req.user.id).length > 0 ){
            return res.status(400).json({ msg: 'Post already liked by you' });
        }

        post.likes.unshift({ user: req.user.id });

        await post.save();
        res.json(post.likes);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route       PUT api/posts/unlike/:post_id
// @desc        Unlike a post
// @access      Private

router.put('/unlike/:post_id', auth, async (req,res) => {
    try {
        const post = await Post.findById(req.params.post_id);
        // Check if the post is already liked by this user
        if( post.likes.filter(like => like.user.toString() === req.user.id).length == 0 ){
            return res.status(400).json({ msg: 'Post has not yet been liked' });
        }

        const removeIndex = post.likes.map(like => like.user.toString()).indexOf(req.user.id);

        post.likes.splice(removeIndex, 1);

        await post.save();
        res.json(post.likes);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route       POST api/posts/commment/:id
// @desc        Comment on a post
// @access      Private

router.post('/comment/:id', [ auth, [
    check('text', 'Text is required').notEmpty()
]], async (req, res) => {
    const errors = validationResult(req);
    if( !errors.isEmpty() ){
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const user = await User.findById(req.user.id).select('-password');
        const post = await Post.findById(req.params.id);
        const newComment = {
            text: req.body.text,
            name: user.name,
            avatar: user.avatar,
            user: req.user.id
        };
        post.comments.unshift(newComment);
        await post.save();
        res.json(post.comments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }

});

// @route       DELETE api/posts/commment/:id/:comment_id
// @desc        Delete comment
// @access      Private

router.delete('/comment/:id/:comment_id', auth, async (req, res) => {
    try {
      const post = await Post.findById(req.params.id);
  
      // Pull out comment
      const comment = post.comments.find(
        (comment) => comment.id === req.params.comment_id
      );
      // Make sure comment exists
      if (!comment) {
        return res.status(404).json({ msg: 'Comment does not exist' });
      }
      // Check user
      if (comment.user.toString() !== req.user.id) {
        return res.status(401).json({ msg: 'User not authorized' });
      }
  
      post.comments = post.comments.filter(
        ({ id }) => id !== req.params.comment_id
      );
  
      await post.save();
  
      return res.json(post.comments);
    } catch (err) {
      console.error(err.message);
      return res.status(500).send('Server Error');
    }
  });

export default router;