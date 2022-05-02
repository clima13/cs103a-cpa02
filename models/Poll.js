'use strict';
const mongoose = require( 'mongoose' );
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

var pollSchema = Schema( {
  title: String,
  description: String,
  totalResponses: Number,
  dateCreated: Date,
  questions: [{
      question: String,
      totalResponses: Number,
      options: [{
          name: String,
          responses: Number,
      }],
  }],
} );

module.exports = mongoose.model( 'Poll', pollSchema );
