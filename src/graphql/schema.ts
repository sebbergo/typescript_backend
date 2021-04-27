import { makeExecutableSchema } from "graphql-tools";
import { resolvers } from "./resolvers";

const typeDefs = `
    enum Gender {
        MALE
        FEMALE
        OTHER 
    }

    type Friend {
        id: ID
        firstName: String
        lastName: String
        email: String
        gender: Gender
        age: Int
        role: String
    }

    """
    Queries available for Friends
    """
     type Query {
        """
        Returns all details for all Friends
        (Should probably require 'admin' rights if your are using authentication)
        """
        allFriends : [Friend]!
        """
        Only required if you ALSO wan't to try a version where the result is fetched from the existing endpoint
        """
        getAllFriendsProxy: [Friend]!
        """
        Edits friend with given email
        """
        editFriend: [Friend]!
        """
        Finds a user with the given email
        """
        findFriend(input: String): Friend
    }
    
    input FriendInput {
        firstName: String!
        lastName: String!
        password: String!
        email: String!
        gender: Gender!
        age: Int!
    }

    input FriendEditInput {
        firstName: String
        lastName: String
        password: String
        email: String!
        gender: Gender!
        age: Int!
    }

    type Mutation {
       """
       Allows anyone (non authenticated users) to create a new friend
       """
       createFriend(input: FriendInput): Friend

       """
       Allows anyone authenticated to edit themselves
       """
       updateFriend(input: FriendInput): Friend

       """
       Allows anyone authenticated to delete
       """
       deleteFriend(input: String): Boolean
    }
`;

const schema = makeExecutableSchema({ typeDefs, resolvers });

export { schema };
