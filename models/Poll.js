'use strict';
const mongoose = require( 'mongoose' );
const Schema = mongoose.Schema;

var pollSchema = Schema( {
  title: String,
  description: String,
  totalResponses: Number,
  dateCreated: Date,
  createdBy: String,
  questions: [{
      question: String,
      totalResponses: Number,
      options: [{
          name: String,
          responses: Number,
      }],
  }],
  usersResponded: [String],
} );

module.exports = mongoose.model( 'Poll', pollSchema );
