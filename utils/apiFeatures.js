class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }
  
paginate() {
  const page = this.queryString.page * 1 || 1;
  const limit = this.queryString.limit * 1 || 10; 
  const offset = (page - 1) * limit;

  this.query += ` LIMIT ${limit} OFFSET ${offset}`;
  return this;
}

filterBySearch() {
  if (this.queryString.search) {
      const searchTerm = this.queryString.search;
      this.query += ` WHERE title LIKE '%${searchTerm}%' 
                     OR conference_or_journal_name LIKE '%${searchTerm}%' 
                     OR publisher_name LIKE '%${searchTerm}%'
                     OR faculty_name LIKE '%${searchTerm}%'
                     OR type_of_paper LIKE '%${searchTerm}'`;
  }
  return this;
}
}
module.exports = APIFeatures;
