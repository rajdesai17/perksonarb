
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract SimpleBuyMeACoffee {
    // Events
    event CreatorRegistered(string username, address creator, uint256 timestamp);
    event CoffeePurchased(
        string indexed creatorUsername,
        address indexed supporter,
        string message,
        uint256 amount,
        uint256 timestamp
    );

    // username → wallet address mapping
    mapping(string => address) public creators;

    // username → creator info
    mapping(string => CreatorInfo) public creatorInfo;

    // All coffee purchases in one global array
    Coffee[] public allCoffees;

    struct CreatorInfo {
        address wallet;
        string username;
        uint256 registeredAt;
        bool exists;
    }

    struct Coffee {
        string creatorUsername;
        address supporter;
        string message;
        uint256 amount;
        uint256 timestamp;
    }

    // Register as a creator
    function registerCreator(string memory username) external {
        require(bytes(username).length > 0, "Username cannot be empty");
        require(bytes(username).length <= 20, "Username too long (max 20 chars)");
        require(!creatorInfo[username].exists, "Username already taken");
        require(creators[username] == address(0), "Username already registered");

        creators[username] = msg.sender;
        creatorInfo[username] = CreatorInfo({
            wallet: msg.sender,
            username: username,
            registeredAt: block.timestamp,
            exists: true
        });

        emit CreatorRegistered(username, msg.sender, block.timestamp);
    }

    // Buy coffee for any creator - direct transfer to creator
    function buyCoffee(string memory username, string memory message) external payable {
        require(msg.value > 0, "Must send some ETH");
        require(creatorInfo[username].exists, "Creator not found");

        address creator = creators[username];
        require(creator != address(0), "Invalid creator address");

        // Direct transfer to creator's wallet
        payable(creator).transfer(msg.value);

        // Store coffee data globally
        allCoffees.push(Coffee({
            creatorUsername: username,
            supporter: msg.sender,
            message: message,
            amount: msg.value,
            timestamp: block.timestamp
        }));

        emit CoffeePurchased(username, msg.sender, message, msg.value, block.timestamp);
    }

    // Get all coffees (for admin/stats)
    function getAllCoffees() external view returns (Coffee[] memory) {
        return allCoffees;
    }

    // Get coffees for a specific creator
    function getCoffeesForCreator(string memory username) external view returns (Coffee[] memory) {
        require(creatorInfo[username].exists, "Creator not found");

        // Count coffees for this creator
        uint256 count = 0;
        for (uint256 i = 0; i < allCoffees.length; i++) {
            if (keccak256(bytes(allCoffees[i].creatorUsername)) == keccak256(bytes(username))) {
                count++;
            }
        }

        // Create result array
        Coffee[] memory creatorCoffees = new Coffee[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < allCoffees.length; i++) {
            if (keccak256(bytes(allCoffees[i].creatorUsername)) == keccak256(bytes(username))) {
                creatorCoffees[index] = allCoffees[i];
                index++;
            }
        }

        return creatorCoffees;
    }

    // Get recent coffees for a creator (last N)
    function getRecentCoffeesForCreator(string memory username, uint256 limit) external view returns (Coffee[] memory) {
        require(creatorInfo[username].exists, "Creator not found");

        // Find coffees for this creator (in reverse order)
        Coffee[] memory tempCoffees = new Coffee[](allCoffees.length);
        uint256 count = 0;

        for (uint256 i = allCoffees.length; i > 0; i--) {
            if (keccak256(bytes(allCoffees[i-1].creatorUsername)) == keccak256(bytes(username))) {
                tempCoffees[count] = allCoffees[i-1];
                count++;
                if (count >= limit) break;
            }
        }

        // Create result array with actual size
        Coffee[] memory result = new Coffee[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = tempCoffees[i];
        }

        return result;
    }

    // Get total coffees for a creator
    function getTotalCoffeesForCreator(string memory username) external view returns (uint256) {
        require(creatorInfo[username].exists, "Creator not found");

        uint256 count = 0;
        for (uint256 i = 0; i < allCoffees.length; i++) {
            if (keccak256(bytes(allCoffees[i].creatorUsername)) == keccak256(bytes(username))) {
                count++;
            }
        }
        return count;
    }

    // Get total amount raised for a creator
    function getTotalRaisedForCreator(string memory username) external view returns (uint256) {
        require(creatorInfo[username].exists, "Creator not found");

        uint256 total = 0;
        for (uint256 i = 0; i < allCoffees.length; i++) {
            if (keccak256(bytes(allCoffees[i].creatorUsername)) == keccak256(bytes(username))) {
                total += allCoffees[i].amount;
            }
        }
        return total;
    }

    // Check if username is available
    function isUsernameAvailable(string memory username) external view returns (bool) {
        return !creatorInfo[username].exists;
    }

    // Get creator info
    function getCreatorInfo(string memory username) external view returns (CreatorInfo memory) {
        require(creatorInfo[username].exists, "Creator not found");
        return creatorInfo[username];
    }

    // Get total number of coffees
    function getTotalCoffees() external view returns (uint256) {
        return allCoffees.length;
    }
}

