

class DBConnection {
    constructor(conString) {
        this.conString = conString
    }
  
    static getInstance(conString) {
      if (!this.instance) {
        this.instance = new DBConnection(conString);
      }
  
      return this.instance;
    }
  }
  
  let con1 = DBConnection.getInstance('mysqldb1');
  let con2 = DBConnection.getInstance('mysqldb2');
  
  //the connections are the same
  console.log("con1: "+con1.conString);
  console.log("con2: "+con2.conString);
  